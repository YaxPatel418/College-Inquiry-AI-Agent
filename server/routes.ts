import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertStudentSchema, insertFacultySchema, insertCourseSchema, insertCourseAssignmentSchema, insertEnrollmentSchema, insertAttendanceSchema, insertGradeSchema, insertEventSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    user: {
      id: number;
      username: string;
      role: string;
      name: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup session middleware
  const MemoryStoreInstance = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "college-management-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    store: new MemoryStoreInstance({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check role
  const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: any) => {
      if (!req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    };
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByCredentials(credentials);

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Store user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      };

      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.session.user) {
      return res.json({ 
        isAuthenticated: true, 
        user: req.session.user 
      });
    }
    res.json({ isAuthenticated: false });
  });

  // User routes
  app.get("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        profileImage: u.profileImage
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow admins to view other users, or users to view themselves
      if (req.session.user.role !== "admin" && req.session.user.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve user" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow admins to update other users, or users to update themselves
      if (req.session.user.role !== "admin" && req.session.user.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // If changing username, check if it already exists
      if (req.body.username && req.body.username !== user.username) {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }

      // Don't allow role change unless admin
      if (req.body.role && req.body.role !== user.role && req.session.user.role !== "admin") {
        return res.status(403).json({ message: "Cannot change role" });
      }

      const updatedUser = await storage.updateUser(id, req.body);

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Don't allow deleting yourself
      if (req.session.user.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Student routes
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      
      // Fetch user data for each student
      const studentsWithDetails = await Promise.all(
        students.map(async (student) => {
          const user = await storage.getUser(student.userId);
          return {
            ...student,
            user: user ? {
              id: user.id,
              username: user.username,
              email: user.email,
              name: user.name,
              profileImage: user.profileImage
            } : null
          };
        })
      );
      
      res.json(studentsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve students" });
    }
  });

  app.get("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const studentDetails = await storage.getStudentDetails(id);

      if (!studentDetails) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(studentDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve student" });
    }
  });

  app.post("/api/students", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      
      // Verify user exists and is a student
      const user = await storage.getUser(studentData.userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      if (user.role !== "student") {
        return res.status(400).json({ message: "User is not a student" });
      }
      
      // Check if student ID already exists
      const existingStudent = await storage.getStudentByStudentId(studentData.studentId);
      if (existingStudent) {
        return res.status(400).json({ message: "Student ID already exists" });
      }
      
      // Check if user already has a student profile
      const existingProfile = await storage.getStudentByUserId(studentData.userId);
      if (existingProfile) {
        return res.status(400).json({ message: "User already has a student profile" });
      }

      const student = await storage.createStudent(studentData);
      
      res.status(201).json({
        ...student,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // If changing student ID, check if it already exists
      if (req.body.studentId && req.body.studentId !== student.studentId) {
        const existingStudent = await storage.getStudentByStudentId(req.body.studentId);
        if (existingStudent && existingStudent.id !== id) {
          return res.status(400).json({ message: "Student ID already exists" });
        }
      }

      const updatedStudent = await storage.updateStudent(id, req.body);

      if (!updatedStudent) {
        return res.status(500).json({ message: "Failed to update student" });
      }

      const user = await storage.getUser(updatedStudent.userId);

      res.json({
        ...updatedStudent,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteStudent(id);

      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Faculty routes
  app.get("/api/faculty", requireAuth, async (req, res) => {
    try {
      const facultyMembers = await storage.getAllFaculty();
      
      // Fetch user data for each faculty member
      const facultyWithDetails = await Promise.all(
        facultyMembers.map(async (faculty) => {
          const user = await storage.getUser(faculty.userId);
          return {
            ...faculty,
            user: user ? {
              id: user.id,
              username: user.username,
              email: user.email,
              name: user.name,
              profileImage: user.profileImage
            } : null
          };
        })
      );
      
      res.json(facultyWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve faculty members" });
    }
  });

  app.get("/api/faculty/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const faculty = await storage.getFaculty(id);

      if (!faculty) {
        return res.status(404).json({ message: "Faculty member not found" });
      }

      const user = await storage.getUser(faculty.userId);
      
      // Get courses assigned to this faculty
      const courseAssignments = await storage.getCourseAssignmentsByFaculty(id);
      const courses = await Promise.all(
        courseAssignments.map(async (assignment) => {
          const course = await storage.getCourse(assignment.courseId);
          return {
            ...assignment,
            course
          };
        })
      );

      res.json({
        ...faculty,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage
        } : null,
        courses
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve faculty member" });
    }
  });

  app.post("/api/faculty", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const facultyData = insertFacultySchema.parse(req.body);
      
      // Verify user exists and is faculty
      const user = await storage.getUser(facultyData.userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      if (user.role !== "faculty") {
        return res.status(400).json({ message: "User is not faculty" });
      }
      
      // Check if faculty ID already exists
      const existingFaculty = await storage.getFacultyByFacultyId(facultyData.facultyId);
      if (existingFaculty) {
        return res.status(400).json({ message: "Faculty ID already exists" });
      }
      
      // Check if user already has a faculty profile
      const existingProfile = await storage.getFacultyByUserId(facultyData.userId);
      if (existingProfile) {
        return res.status(400).json({ message: "User already has a faculty profile" });
      }

      const faculty = await storage.createFaculty(facultyData);
      
      res.status(201).json({
        ...faculty,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create faculty member" });
    }
  });

  app.put("/api/faculty/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const faculty = await storage.getFaculty(id);

      if (!faculty) {
        return res.status(404).json({ message: "Faculty member not found" });
      }

      // If changing faculty ID, check if it already exists
      if (req.body.facultyId && req.body.facultyId !== faculty.facultyId) {
        const existingFaculty = await storage.getFacultyByFacultyId(req.body.facultyId);
        if (existingFaculty && existingFaculty.id !== id) {
          return res.status(400).json({ message: "Faculty ID already exists" });
        }
      }

      const updatedFaculty = await storage.updateFaculty(id, req.body);

      if (!updatedFaculty) {
        return res.status(500).json({ message: "Failed to update faculty member" });
      }

      const user = await storage.getUser(updatedFaculty.userId);

      res.json({
        ...updatedFaculty,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update faculty member" });
    }
  });

  app.delete("/api/faculty/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFaculty(id);

      if (!deleted) {
        return res.status(404).json({ message: "Faculty member not found" });
      }

      res.json({ message: "Faculty member deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete faculty member" });
    }
  });

  // Course routes
  app.get("/api/courses", requireAuth, async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve courses" });
    }
  });

  app.get("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get faculty assigned to this course
      const courseAssignments = await storage.getCourseAssignmentsByCourse(id);
      const assignmentsWithFaculty = await Promise.all(
        courseAssignments.map(async (assignment) => {
          const faculty = await storage.getFaculty(assignment.facultyId);
          const user = faculty ? await storage.getUser(faculty.userId) : null;
          
          return {
            ...assignment,
            faculty,
            facultyName: user?.name
          };
        })
      );

      res.json({
        ...course,
        assignments: assignmentsWithFaculty
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve course" });
    }
  });

  app.post("/api/courses", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      
      // Check if course code already exists
      const existingCourse = await storage.getCourseByCode(courseData.code);
      if (existingCourse) {
        return res.status(400).json({ message: "Course code already exists" });
      }

      const course = await storage.createCourse(courseData);
      
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // If changing course code, check if it already exists
      if (req.body.code && req.body.code !== course.code) {
        const existingCourse = await storage.getCourseByCode(req.body.code);
        if (existingCourse && existingCourse.id !== id) {
          return res.status(400).json({ message: "Course code already exists" });
        }
      }

      const updatedCourse = await storage.updateCourse(id, req.body);

      if (!updatedCourse) {
        return res.status(500).json({ message: "Failed to update course" });
      }

      res.json(updatedCourse);
    } catch (error) {
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCourse(id);

      if (!deleted) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Course Assignment routes
  app.post("/api/course-assignments", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const assignmentData = insertCourseAssignmentSchema.parse(req.body);
      
      // Verify course exists
      const course = await storage.getCourse(assignmentData.courseId);
      if (!course) {
        return res.status(400).json({ message: "Course not found" });
      }
      
      // Verify faculty exists
      const faculty = await storage.getFaculty(assignmentData.facultyId);
      if (!faculty) {
        return res.status(400).json({ message: "Faculty member not found" });
      }

      const assignment = await storage.createCourseAssignment(assignmentData);
      
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course assignment" });
    }
  });

  app.delete("/api/course-assignments/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCourseAssignment(id);

      if (!deleted) {
        return res.status(404).json({ message: "Course assignment not found" });
      }

      res.json({ message: "Course assignment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course assignment" });
    }
  });

  // Enrollment routes
  app.post("/api/enrollments", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      
      // Verify student exists
      const student = await storage.getStudent(enrollmentData.studentId);
      if (!student) {
        return res.status(400).json({ message: "Student not found" });
      }
      
      // Verify course assignment exists
      const courseAssignment = await storage.getCourseAssignment(enrollmentData.courseAssignmentId);
      if (!courseAssignment) {
        return res.status(400).json({ message: "Course assignment not found" });
      }
      
      // Check if student is already enrolled in this course
      const enrollments = await storage.getEnrollmentsByStudent(enrollmentData.studentId);
      const alreadyEnrolled = enrollments.some(
        e => e.courseAssignmentId === enrollmentData.courseAssignmentId && e.status === "enrolled"
      );
      
      if (alreadyEnrolled) {
        return res.status(400).json({ message: "Student is already enrolled in this course" });
      }

      const enrollment = await storage.createEnrollment(enrollmentData);
      
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  app.put("/api/enrollments/:id", requireAuth, requireRole(["admin", "faculty"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrollment = await storage.getEnrollment(id);

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const updatedEnrollment = await storage.updateEnrollment(id, req.body);

      if (!updatedEnrollment) {
        return res.status(500).json({ message: "Failed to update enrollment" });
      }

      res.json(updatedEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update enrollment" });
    }
  });

  app.delete("/api/enrollments/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEnrollment(id);

      if (!deleted) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      res.json({ message: "Enrollment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  // Attendance routes
  app.get("/api/attendance/enrollment/:enrollmentId", requireAuth, async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.enrollmentId);
      const attendanceRecords = await storage.getAttendanceByEnrollment(enrollmentId);
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve attendance records" });
    }
  });

  app.post("/api/attendance", requireAuth, requireRole(["admin", "faculty"]), async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      
      // Verify enrollment exists
      const enrollment = await storage.getEnrollment(attendanceData.enrollmentId);
      if (!enrollment) {
        return res.status(400).json({ message: "Enrollment not found" });
      }

      const attendance = await storage.createAttendance(attendanceData);
      
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  app.put("/api/attendance/:id", requireAuth, requireRole(["admin", "faculty"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const attendance = await storage.getAttendance(id);

      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      const updatedAttendance = await storage.updateAttendance(id, req.body);

      if (!updatedAttendance) {
        return res.status(500).json({ message: "Failed to update attendance record" });
      }

      res.json(updatedAttendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendance record" });
    }
  });

  app.delete("/api/attendance/:id", requireAuth, requireRole(["admin", "faculty"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAttendance(id);

      if (!deleted) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      res.json({ message: "Attendance record deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attendance record" });
    }
  });

  // Grade routes
  app.get("/api/grades/enrollment/:enrollmentId", requireAuth, async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.enrollmentId);
      const grades = await storage.getGradesByEnrollment(enrollmentId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve grades" });
    }
  });

  app.post("/api/grades", requireAuth, requireRole(["admin", "faculty"]), async (req, res) => {
    try {
      const gradeData = insertGradeSchema.parse(req.body);
      
      // Verify enrollment exists
      const enrollment = await storage.getEnrollment(gradeData.enrollmentId);
      if (!enrollment) {
        return res.status(400).json({ message: "Enrollment not found" });
      }

      const grade = await storage.createGrade(gradeData);
      
      res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create grade" });
    }
  });

  app.put("/api/grades/:id", requireAuth, requireRole(["admin", "faculty"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const grade = await storage.getGrade(id);

      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }

      const updatedGrade = await storage.updateGrade(id, req.body);

      if (!updatedGrade) {
        return res.status(500).json({ message: "Failed to update grade" });
      }

      res.json(updatedGrade);
    } catch (error) {
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  app.delete("/api/grades/:id", requireAuth, requireRole(["admin", "faculty"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGrade(id);

      if (!deleted) {
        return res.status(404).json({ message: "Grade not found" });
      }

      res.json({ message: "Grade deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete grade" });
    }
  });

  // Event routes
  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve events" });
    }
  });

  app.get("/api/events/upcoming", requireAuth, async (req, res) => {
    try {
      const events = await storage.getUpcomingEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve upcoming events" });
    }
  });

  app.post("/api/events", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const updatedEvent = await storage.updateEvent(id, req.body);

      if (!updatedEvent) {
        return res.status(500).json({ message: "Failed to update event" });
      }

      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEvent(id);

      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve dashboard statistics" });
    }
  });

  return httpServer;
}
