import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (for authentication and base user data)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // "admin", "faculty", "student"
  name: text("name").notNull(),
  profileImage: text("profile_image"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Student schema
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  studentId: text("student_id").notNull().unique(),
  program: text("program").notNull(),
  yearLevel: integer("year_level").notNull(),
  status: text("status").notNull().default("active"), // "active", "inactive", "on leave"
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Faculty schema
export const faculty = pgTable("faculty", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  facultyId: text("faculty_id").notNull().unique(),
  department: text("department").notNull(),
  position: text("position").notNull(),
  joinDate: timestamp("join_date").notNull().defaultNow(),
  status: text("status").notNull().default("active"), // "active", "inactive", "on leave"
});

export const insertFacultySchema = createInsertSchema(faculty).omit({ id: true });
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Faculty = typeof faculty.$inferSelect;

// Course schema
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  credits: integer("credits").notNull(),
  department: text("department").notNull(),
  status: text("status").notNull().default("active"), // "active", "pending", "archived"
});

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Course Assignment (linking courses to faculty)
export const courseAssignments = pgTable("course_assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  facultyId: integer("faculty_id").notNull().references(() => faculty.id),
  semester: text("semester").notNull(),
  year: integer("year").notNull(),
});

export const insertCourseAssignmentSchema = createInsertSchema(courseAssignments).omit({ id: true });
export type InsertCourseAssignment = z.infer<typeof insertCourseAssignmentSchema>;
export type CourseAssignment = typeof courseAssignments.$inferSelect;

// Course Enrollment (linking students to courses)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  courseAssignmentId: integer("course_assignment_id").notNull().references(() => courseAssignments.id),
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
  status: text("status").notNull().default("enrolled"), // "enrolled", "dropped", "completed"
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true });
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Attendance schema
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id),
  date: timestamp("date").notNull().defaultNow(),
  status: text("status").notNull(), // "present", "absent", "late", "excused"
  notes: text("notes"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// Grades schema
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id),
  assignmentName: text("assignment_name").notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  weight: integer("weight").notNull(), // percentage weight of the assignment
  date: timestamp("date").notNull().defaultNow(),
});

export const insertGradeSchema = createInsertSchema(grades).omit({ id: true });
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;

// Events schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  type: text("type").notNull(), // "academic", "administrative", "extracurricular"
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Login schema (not a database table, just for validation)
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
