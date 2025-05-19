import { 
  User, InsertUser, users,
  Student, InsertStudent, students,
  Faculty, InsertFaculty, faculty,
  Course, InsertCourse, courses,
  CourseAssignment, InsertCourseAssignment, courseAssignments,
  Enrollment, InsertEnrollment, enrollments,
  Attendance, InsertAttendance, attendance,
  Grade, InsertGrade, grades,
  Event, InsertEvent, events,
  LoginCredentials
} from "@shared/schema";
import { format } from "date-fns";

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByCredentials(credentials: LoginCredentials): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  getAllStudents(): Promise<Student[]>;
  getStudentDetails(id: number): Promise<any>;

  // Faculty operations
  getFaculty(id: number): Promise<Faculty | undefined>;
  getFacultyByFacultyId(facultyId: string): Promise<Faculty | undefined>;
  getFacultyByUserId(userId: number): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  updateFaculty(id: number, faculty: Partial<Faculty>): Promise<Faculty | undefined>;
  deleteFaculty(id: number): Promise<boolean>;
  getAllFaculty(): Promise<Faculty[]>;

  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  getAllCourses(): Promise<Course[]>;

  // Course Assignment operations
  getCourseAssignment(id: number): Promise<CourseAssignment | undefined>;
  createCourseAssignment(assignment: InsertCourseAssignment): Promise<CourseAssignment>;
  updateCourseAssignment(id: number, assignment: Partial<CourseAssignment>): Promise<CourseAssignment | undefined>;
  deleteCourseAssignment(id: number): Promise<boolean>;
  getAllCourseAssignments(): Promise<CourseAssignment[]>;
  getCourseAssignmentsByCourse(courseId: number): Promise<CourseAssignment[]>;
  getCourseAssignmentsByFaculty(facultyId: number): Promise<CourseAssignment[]>;

  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;
  getAllEnrollments(): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourseAssignment(courseAssignmentId: number): Promise<Enrollment[]>;

  // Attendance operations
  getAttendance(id: number): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;
  getAllAttendance(): Promise<Attendance[]>;
  getAttendanceByEnrollment(enrollmentId: number): Promise<Attendance[]>;

  // Grade operations
  getGrade(id: number): Promise<Grade | undefined>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;
  getAllGrades(): Promise<Grade[]>;
  getGradesByEnrollment(enrollmentId: number): Promise<Grade[]>;

  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;

  // Dashboard data
  getDashboardStats(): Promise<any>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private faculty: Map<number, Faculty>;
  private courses: Map<number, Course>;
  private courseAssignments: Map<number, CourseAssignment>;
  private enrollments: Map<number, Enrollment>;
  private attendance: Map<number, Attendance>;
  private grades: Map<number, Grade>;
  private events: Map<number, Event>;

  private currentIds: {
    user: number;
    student: number;
    faculty: number;
    course: number;
    courseAssignment: number;
    enrollment: number;
    attendance: number;
    grade: number;
    event: number;
  };

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.faculty = new Map();
    this.courses = new Map();
    this.courseAssignments = new Map();
    this.enrollments = new Map();
    this.attendance = new Map();
    this.grades = new Map();
    this.events = new Map();

    this.currentIds = {
      user: 1,
      student: 1,
      faculty: 1,
      course: 1,
      courseAssignment: 1,
      enrollment: 1,
      attendance: 1,
      grade: 1,
      event: 1,
    };

    // Initialize with some sample data
    this.initializeData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByCredentials(credentials: LoginCredentials): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => 
        user.username.toLowerCase() === credentials.username.toLowerCase() && 
        user.password === credentials.password
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.studentId === studentId
    );
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.userId === userId
    );
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.currentIds.student++;
    const newStudent: Student = { ...student, id };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...studentData };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudentDetails(id: number): Promise<any> {
    const student = await this.getStudent(id);
    if (!student) return null;
    
    const user = await this.getUser(student.userId);
    if (!user) return null;
    
    const enrollments = await this.getEnrollmentsByStudent(id);
    
    // Get course details for each enrollment
    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseAssignment = await this.getCourseAssignment(enrollment.courseAssignmentId);
        if (!courseAssignment) return null;
        
        const course = await this.getCourse(courseAssignment.courseId);
        const facultyMember = await this.getFaculty(courseAssignment.facultyId);
        const facultyUser = facultyMember ? await this.getUser(facultyMember.userId) : null;
        
        // Get attendance records
        const attendanceRecords = await this.getAttendanceByEnrollment(enrollment.id);
        
        // Get grades
        const gradeRecords = await this.getGradesByEnrollment(enrollment.id);
        
        return {
          enrollment,
          course,
          faculty: facultyMember,
          facultyName: facultyUser?.name,
          attendance: attendanceRecords,
          grades: gradeRecords,
          semester: courseAssignment.semester,
          year: courseAssignment.year
        };
      })
    );
    
    return {
      ...student,
      user,
      enrollments: courses.filter(Boolean)
    };
  }

  // Faculty operations
  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculty.get(id);
  }

  async getFacultyByFacultyId(facultyId: string): Promise<Faculty | undefined> {
    return Array.from(this.faculty.values()).find(
      (faculty) => faculty.facultyId === facultyId
    );
  }

  async getFacultyByUserId(userId: number): Promise<Faculty | undefined> {
    return Array.from(this.faculty.values()).find(
      (faculty) => faculty.userId === userId
    );
  }

  async createFaculty(faculty: InsertFaculty): Promise<Faculty> {
    const id = this.currentIds.faculty++;
    const newFaculty: Faculty = { ...faculty, id };
    this.faculty.set(id, newFaculty);
    return newFaculty;
  }

  async updateFaculty(id: number, facultyData: Partial<Faculty>): Promise<Faculty | undefined> {
    const faculty = this.faculty.get(id);
    if (!faculty) return undefined;
    
    const updatedFaculty = { ...faculty, ...facultyData };
    this.faculty.set(id, updatedFaculty);
    return updatedFaculty;
  }

  async deleteFaculty(id: number): Promise<boolean> {
    return this.faculty.delete(id);
  }

  async getAllFaculty(): Promise<Faculty[]> {
    return Array.from(this.faculty.values());
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(
      (course) => course.code === code
    );
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.currentIds.course++;
    const newCourse: Course = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...courseData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  // Course Assignment operations
  async getCourseAssignment(id: number): Promise<CourseAssignment | undefined> {
    return this.courseAssignments.get(id);
  }

  async createCourseAssignment(assignment: InsertCourseAssignment): Promise<CourseAssignment> {
    const id = this.currentIds.courseAssignment++;
    const newAssignment: CourseAssignment = { ...assignment, id };
    this.courseAssignments.set(id, newAssignment);
    return newAssignment;
  }

  async updateCourseAssignment(id: number, assignmentData: Partial<CourseAssignment>): Promise<CourseAssignment | undefined> {
    const assignment = this.courseAssignments.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { ...assignment, ...assignmentData };
    this.courseAssignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteCourseAssignment(id: number): Promise<boolean> {
    return this.courseAssignments.delete(id);
  }

  async getAllCourseAssignments(): Promise<CourseAssignment[]> {
    return Array.from(this.courseAssignments.values());
  }

  async getCourseAssignmentsByCourse(courseId: number): Promise<CourseAssignment[]> {
    return Array.from(this.courseAssignments.values()).filter(
      (assignment) => assignment.courseId === courseId
    );
  }

  async getCourseAssignmentsByFaculty(facultyId: number): Promise<CourseAssignment[]> {
    return Array.from(this.courseAssignments.values()).filter(
      (assignment) => assignment.facultyId === facultyId
    );
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.currentIds.enrollment++;
    const newEnrollment: Enrollment = { ...enrollment, id };
    this.enrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...enrollmentData };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    return this.enrollments.delete(id);
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values());
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.studentId === studentId
    );
  }

  async getEnrollmentsByCourseAssignment(courseAssignmentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.courseAssignmentId === courseAssignmentId
    );
  }

  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentIds.attendance++;
    const newAttendance: Attendance = { ...attendance, id };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...attendanceData };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async deleteAttendance(id: number): Promise<boolean> {
    return this.attendance.delete(id);
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return Array.from(this.attendance.values());
  }

  async getAttendanceByEnrollment(enrollmentId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (attendance) => attendance.enrollmentId === enrollmentId
    );
  }

  // Grade operations
  async getGrade(id: number): Promise<Grade | undefined> {
    return this.grades.get(id);
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const id = this.currentIds.grade++;
    const newGrade: Grade = { ...grade, id };
    this.grades.set(id, newGrade);
    return newGrade;
  }

  async updateGrade(id: number, gradeData: Partial<Grade>): Promise<Grade | undefined> {
    const grade = this.grades.get(id);
    if (!grade) return undefined;
    
    const updatedGrade = { ...grade, ...gradeData };
    this.grades.set(id, updatedGrade);
    return updatedGrade;
  }

  async deleteGrade(id: number): Promise<boolean> {
    return this.grades.delete(id);
  }

  async getAllGrades(): Promise<Grade[]> {
    return Array.from(this.grades.values());
  }

  async getGradesByEnrollment(enrollmentId: number): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(
      (grade) => grade.enrollmentId === enrollmentId
    );
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.currentIds.event++;
    const newEvent: Event = { ...event, id };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    return Array.from(this.events.values()).filter(
      (event) => new Date(event.startDate) > now
    ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<any> {
    const students = await this.getAllStudents();
    const facultyMembers = await this.getAllFaculty();
    const courses = await this.getAllCourses();
    const allAttendance = await this.getAllAttendance();

    // Calculate attendance rate
    const totalAttendanceRecords = allAttendance.length;
    const presentAttendance = allAttendance.filter(record => 
      record.status === "present" || record.status === "late"
    ).length;
    
    const attendanceRate = totalAttendanceRecords > 0 
      ? (presentAttendance / totalAttendanceRecords) * 100 
      : 0;
    
    // Course statistics
    const activeCourses = courses.filter(c => c.status === "active").length;
    const pendingCourses = courses.filter(c => c.status === "pending").length;
    const archivedCourses = courses.filter(c => c.status === "archived").length;
    
    const totalCourses = courses.length;
    const activeCoursesPercentage = totalCourses > 0 ? (activeCourses / totalCourses) * 100 : 0;
    const pendingCoursesPercentage = totalCourses > 0 ? (pendingCourses / totalCourses) * 100 : 0;
    const archivedCoursesPercentage = totalCourses > 0 ? (archivedCourses / totalCourses) * 100 : 0;
    
    // Popular courses with student count
    const enrollments = await this.getAllEnrollments();
    const courseAssignments = await this.getAllCourseAssignments();
    
    const coursesWithEnrollments = await Promise.all(
      courses.map(async (course) => {
        const assignments = await this.getCourseAssignmentsByCourse(course.id);
        let studentCount = 0;
        
        for (const assignment of assignments) {
          const assignmentEnrollments = await this.getEnrollmentsByCourseAssignment(assignment.id);
          studentCount += assignmentEnrollments.length;
        }
        
        return {
          id: course.id,
          code: course.code,
          title: course.title,
          studentCount
        };
      })
    );
    
    const popularCourses = coursesWithEnrollments
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 3);
    
    return {
      totalStudents: students.length,
      totalFaculty: facultyMembers.length,
      totalCourses: courses.length,
      activeCourses,
      attendanceRate: parseFloat(attendanceRate.toFixed(1)),
      courseStatistics: {
        active: {
          count: activeCourses,
          percentage: parseFloat(activeCoursesPercentage.toFixed(1))
        },
        pending: {
          count: pendingCourses,
          percentage: parseFloat(pendingCoursesPercentage.toFixed(1))
        },
        archived: {
          count: archivedCourses,
          percentage: parseFloat(archivedCoursesPercentage.toFixed(1))
        }
      },
      popularCourses
    };
  }

  // Initialize sample data
  private initializeData() {
    // Create users
    const adminUser = this.createUserSync({
      username: "admin",
      password: "admin123",
      email: "admin@college.edu",
      role: "admin",
      name: "John Admin",
      profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    });

    // Create faculty users
    const faculty1 = this.createUserSync({
      username: "professor.smith",
      password: "faculty123",
      email: "smith@college.edu",
      role: "faculty",
      name: "Professor Smith",
      profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    });

    const faculty2 = this.createUserSync({
      username: "professor.johnson",
      password: "faculty123",
      email: "johnson@college.edu",
      role: "faculty",
      name: "Professor Johnson",
      profileImage: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    });

    // Create student users
    const student1 = this.createUserSync({
      username: "emma.wilson",
      password: "student123",
      email: "emma.wilson@example.com",
      role: "student",
      name: "Emma Wilson",
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    });

    const student2 = this.createUserSync({
      username: "james.rodriguez",
      password: "student123",
      email: "james.r@example.com",
      role: "student",
      name: "James Rodriguez",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    });

    const student3 = this.createUserSync({
      username: "sophia.chen",
      password: "student123",
      email: "sophia.c@example.com",
      role: "student",
      name: "Sophia Chen",
      profileImage: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    });

    const student4 = this.createUserSync({
      username: "michael.johnson",
      password: "student123",
      email: "michael.j@example.com",
      role: "student",
      name: "Michael Johnson",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    });

    // Create faculty profiles
    const facultyProfile1 = this.createFacultySync({
      userId: faculty1.id,
      facultyId: "FAC1001",
      department: "Computer Science",
      position: "Professor",
      joinDate: new Date("2018-08-15"),
      status: "active"
    });

    const facultyProfile2 = this.createFacultySync({
      userId: faculty2.id,
      facultyId: "FAC1002",
      department: "Business Administration",
      position: "Associate Professor",
      joinDate: new Date("2016-01-10"),
      status: "active"
    });

    // Create student profiles
    const studentProfile1 = this.createStudentSync({
      userId: student1.id,
      studentId: "STU1001",
      program: "Computer Science",
      yearLevel: 3,
      status: "active",
      enrollmentDate: new Date("2020-09-01")
    });

    const studentProfile2 = this.createStudentSync({
      userId: student2.id,
      studentId: "STU1002",
      program: "Business Administration",
      yearLevel: 2,
      status: "active",
      enrollmentDate: new Date("2021-09-01")
    });

    const studentProfile3 = this.createStudentSync({
      userId: student3.id,
      studentId: "STU1003",
      program: "Electrical Engineering",
      yearLevel: 4,
      status: "on leave",
      enrollmentDate: new Date("2019-09-01")
    });

    const studentProfile4 = this.createStudentSync({
      userId: student4.id,
      studentId: "STU1004",
      program: "Biology",
      yearLevel: 1,
      status: "inactive",
      enrollmentDate: new Date("2022-09-01")
    });

    // Create courses
    const course1 = this.createCourseSync({
      code: "CS101",
      title: "Introduction to Computer Science",
      description: "Fundamental concepts of computer science and programming",
      credits: 3,
      department: "Computer Science",
      status: "active"
    });

    const course2 = this.createCourseSync({
      code: "BA200",
      title: "Business Ethics",
      description: "Ethical principles and moral issues in business management",
      credits: 3,
      department: "Business Administration",
      status: "active"
    });

    const course3 = this.createCourseSync({
      code: "PSY101",
      title: "Psychology 101",
      description: "Introduction to the principles of psychology",
      credits: 3,
      department: "Psychology",
      status: "active"
    });

    const course4 = this.createCourseSync({
      code: "EE201",
      title: "Circuit Analysis",
      description: "Basic principles of electrical circuit analysis",
      credits: 4,
      department: "Electrical Engineering",
      status: "pending"
    });

    const course5 = this.createCourseSync({
      code: "BIO110",
      title: "Introduction to Biology",
      description: "Fundamental principles of biology",
      credits: 4,
      department: "Biology",
      status: "active"
    });

    // Create course assignments
    const assignment1 = this.createCourseAssignmentSync({
      courseId: course1.id,
      facultyId: facultyProfile1.id,
      semester: "Fall",
      year: 2023
    });

    const assignment2 = this.createCourseAssignmentSync({
      courseId: course2.id,
      facultyId: facultyProfile2.id,
      semester: "Fall",
      year: 2023
    });

    const assignment3 = this.createCourseAssignmentSync({
      courseId: course3.id,
      facultyId: facultyProfile1.id,
      semester: "Fall",
      year: 2023
    });

    const assignment4 = this.createCourseAssignmentSync({
      courseId: course5.id,
      facultyId: facultyProfile2.id,
      semester: "Fall",
      year: 2023
    });

    // Create enrollments
    const enrollment1 = this.createEnrollmentSync({
      studentId: studentProfile1.id,
      courseAssignmentId: assignment1.id,
      enrollmentDate: new Date("2023-08-15"),
      status: "enrolled"
    });

    const enrollment2 = this.createEnrollmentSync({
      studentId: studentProfile1.id,
      courseAssignmentId: assignment2.id,
      enrollmentDate: new Date("2023-08-15"),
      status: "enrolled"
    });

    const enrollment3 = this.createEnrollmentSync({
      studentId: studentProfile2.id,
      courseAssignmentId: assignment2.id,
      enrollmentDate: new Date("2023-08-10"),
      status: "enrolled"
    });

    const enrollment4 = this.createEnrollmentSync({
      studentId: studentProfile3.id,
      courseAssignmentId: assignment1.id,
      enrollmentDate: new Date("2023-08-12"),
      status: "enrolled"
    });

    const enrollment5 = this.createEnrollmentSync({
      studentId: studentProfile3.id,
      courseAssignmentId: assignment3.id,
      enrollmentDate: new Date("2023-08-12"),
      status: "enrolled"
    });

    const enrollment6 = this.createEnrollmentSync({
      studentId: studentProfile4.id,
      courseAssignmentId: assignment4.id,
      enrollmentDate: new Date("2023-08-05"),
      status: "enrolled"
    });

    // Create attendance records
    const today = new Date();

    this.createAttendanceSync({
      enrollmentId: enrollment1.id,
      date: new Date(today.setDate(today.getDate() - 1)),
      status: "present",
      notes: ""
    });

    this.createAttendanceSync({
      enrollmentId: enrollment2.id,
      date: new Date(today.setDate(today.getDate() - 1)),
      status: "present",
      notes: ""
    });

    this.createAttendanceSync({
      enrollmentId: enrollment3.id,
      date: new Date(today.setDate(today.getDate() - 1)),
      status: "late",
      notes: "Arrived 10 minutes late"
    });

    this.createAttendanceSync({
      enrollmentId: enrollment4.id,
      date: new Date(today.setDate(today.getDate() - 1)),
      status: "absent",
      notes: ""
    });

    this.createAttendanceSync({
      enrollmentId: enrollment5.id,
      date: new Date(today.setDate(today.getDate() - 1)),
      status: "excused",
      notes: "Doctor's appointment"
    });

    // Create grades
    this.createGradeSync({
      enrollmentId: enrollment1.id,
      assignmentName: "Midterm Exam",
      score: 85,
      maxScore: 100,
      weight: 30,
      date: new Date("2023-10-15")
    });

    this.createGradeSync({
      enrollmentId: enrollment1.id,
      assignmentName: "Assignment 1",
      score: 92,
      maxScore: 100,
      weight: 15,
      date: new Date("2023-09-20")
    });

    this.createGradeSync({
      enrollmentId: enrollment2.id,
      assignmentName: "Midterm Exam",
      score: 78,
      maxScore: 100,
      weight: 30,
      date: new Date("2023-10-17")
    });

    this.createGradeSync({
      enrollmentId: enrollment3.id,
      assignmentName: "Midterm Exam",
      score: 88,
      maxScore: 100,
      weight: 30,
      date: new Date("2023-10-17")
    });

    // Create events
    const currentDate = new Date();
    
    this.createEventSync({
      title: "Faculty Meeting",
      description: "Discussion on curriculum updates for the upcoming semester.",
      startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 9, 0),
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 11, 0),
      location: "Admin Building, Room 302",
      type: "administrative"
    });

    this.createEventSync({
      title: "Science Exhibition",
      description: "Annual science exhibition featuring student projects and innovations.",
      startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18, 10, 0),
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18, 16, 0),
      location: "Science Complex, Main Hall",
      type: "academic"
    });

    this.createEventSync({
      title: "Enrollment Deadline",
      description: "Last day for course enrollment and schedule changes.",
      startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22, 0, 0),
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22, 23, 59),
      location: "Online",
      type: "administrative"
    });
  }

  // Synchronous versions for initialization
  private createUserSync(user: InsertUser): User {
    const id = this.currentIds.user++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  private createStudentSync(student: InsertStudent): Student {
    const id = this.currentIds.student++;
    const newStudent: Student = { ...student, id };
    this.students.set(id, newStudent);
    return newStudent;
  }

  private createFacultySync(faculty: InsertFaculty): Faculty {
    const id = this.currentIds.faculty++;
    const newFaculty: Faculty = { ...faculty, id };
    this.faculty.set(id, newFaculty);
    return newFaculty;
  }

  private createCourseSync(course: InsertCourse): Course {
    const id = this.currentIds.course++;
    const newCourse: Course = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  private createCourseAssignmentSync(assignment: InsertCourseAssignment): CourseAssignment {
    const id = this.currentIds.courseAssignment++;
    const newAssignment: CourseAssignment = { ...assignment, id };
    this.courseAssignments.set(id, newAssignment);
    return newAssignment;
  }

  private createEnrollmentSync(enrollment: InsertEnrollment): Enrollment {
    const id = this.currentIds.enrollment++;
    const newEnrollment: Enrollment = { ...enrollment, id };
    this.enrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  private createAttendanceSync(attendance: InsertAttendance): Attendance {
    const id = this.currentIds.attendance++;
    const newAttendance: Attendance = { ...attendance, id };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  private createGradeSync(grade: InsertGrade): Grade {
    const id = this.currentIds.grade++;
    const newGrade: Grade = { ...grade, id };
    this.grades.set(id, newGrade);
    return newGrade;
  }

  private createEventSync(event: InsertEvent): Event {
    const id = this.currentIds.event++;
    const newEvent: Event = { ...event, id };
    this.events.set(id, newEvent);
    return newEvent;
  }
}

export const storage = new MemStorage();
