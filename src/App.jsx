import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import DashboardHome from './pages/DashboardHome'
import AssessmentAttempt from './pages/AssessmentAttempt'
import TeacherAssessmentEditor from './pages/TeacherAssessmentEditor'
import TeacherGradingQueue from './pages/TeacherGradingQueue'
import ParentChildScores from './pages/ParentChildScores'
import ParentAttendance from './pages/ParentAttendance'
import ParentResults from './pages/ParentResults'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminClasses from './pages/admin/AdminClasses'
import AdminClassCreate from './pages/admin/AdminClassCreate'
import AdminClassEdit from './pages/admin/AdminClassEdit'
import AdminSubjects from './pages/admin/AdminSubjects'
import AdminSubjectCreate from './pages/admin/AdminSubjectCreate'
import AdminSubjectEdit from './pages/admin/AdminSubjectEdit'
import AdminLessons from './pages/admin/AdminLessons'
import AdminLessonCreate from './pages/admin/AdminLessonCreate'
import AdminLessonEdit from './pages/admin/AdminLessonEdit'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserCreate from './pages/admin/AdminUserCreate'
import AdminUserEdit from './pages/admin/AdminUserEdit'
import AdminExams from './pages/admin/AdminExams'
import AdminExamCreate from './pages/admin/AdminExamCreate'
import AdminExamManage from './pages/admin/AdminExamManage'
import AdminExamResults from './pages/admin/AdminExamResults'
import AdminExamSubjectStatus from './pages/admin/AdminExamSubjectStatus'
import AdminSubjectExamDetail from './pages/admin/AdminSubjectExamDetail'
import AdminAttendance from './pages/admin/AdminAttendance'
import TeacherAssessmentCreate from './pages/TeacherAssessmentCreate'
import TeacherAssessmentEdit from './pages/TeacherAssessmentEdit'
import TeacherQuestionCreate from './pages/TeacherQuestionCreate'
import TeacherQuestionEdit from './pages/TeacherQuestionEdit'
import TeacherLessonContent from './pages/TeacherLessonContent'
import StudentLessonContent from './pages/StudentLessonContent'
import TeacherExams from './pages/TeacherExams'
import TeacherExamResults from './pages/TeacherExamResults'
import TeacherSubjectExamList from './pages/TeacherSubjectExamList'
import TeacherSubjectExamManage from './pages/TeacherSubjectExamManage'
import TeacherSubjectExamSectionCreate from './pages/TeacherSubjectExamSectionCreate'
import TeacherSubjectExamSectionEdit from './pages/TeacherSubjectExamSectionEdit'
import TeacherSubjectExamQuestionCreate from './pages/TeacherSubjectExamQuestionCreate'
import TeacherSubjectExamQuestionEdit from './pages/TeacherSubjectExamQuestionEdit'
import SubjectExamAttempt from './pages/SubjectExamAttempt'
import StudentExams from './pages/StudentExams'
import StudentSubjectLessons from './pages/StudentSubjectLessons'
import StudentExamRanking from './pages/StudentExamRanking'
import StudentResults from './pages/StudentResults'
import TeacherAttendance from './pages/TeacherAttendance'
import StudentAttendance from './pages/StudentAttendance'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="classes/new" element={<AdminClassCreate />} />
        <Route path="classes/:id/edit" element={<AdminClassEdit />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="subjects/new" element={<AdminSubjectCreate />} />
        <Route path="subjects/:id/edit" element={<AdminSubjectEdit />} />
        <Route path="lessons" element={<AdminLessons />} />
        <Route path="lessons/new" element={<AdminLessonCreate />} />
        <Route path="lessons/:id/edit" element={<AdminLessonEdit />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/new" element={<AdminUserCreate />} />
        <Route path="users/:id/edit" element={<AdminUserEdit />} />
        <Route path="exams" element={<AdminExams />} />
        <Route path="exams/new" element={<AdminExamCreate />} />
        <Route path="exams/:examId" element={<AdminExamManage />} />
        <Route path="exams/:examId/subjects" element={<AdminExamSubjectStatus />} />
        <Route path="exams/:examId/subjects/:subjectExamId" element={<AdminSubjectExamDetail />} />
        <Route path="exams/:examId/results" element={<AdminExamResults />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/password" element={<ChangePassword />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['teacher', 'student', 'parent']}>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="assessments/:assessmentId" element={<AssessmentAttempt />} />
        <Route path="lessons/:lessonId/assessments" element={<TeacherAssessmentEditor />} />
        <Route path="lessons/:lessonId/assessments/new" element={<TeacherAssessmentCreate />} />
        <Route path="lessons/:lessonId/content" element={<TeacherLessonContent />} />
        <Route path="lessons/:lessonId/read" element={<StudentLessonContent />} />
        <Route path="my-exams" element={<TeacherExams />} />
        <Route path="my-exams/:examId/results" element={<TeacherExamResults />} />
        <Route path="subjects/:subjectId/exams" element={<TeacherSubjectExamList />} />
        <Route path="subjects/:subjectId/exams/:examId" element={<TeacherSubjectExamManage />} />
        <Route
          path="subjects/:subjectId/exams/:examId/sections/new"
          element={<TeacherSubjectExamSectionCreate />}
        />
        <Route
          path="subjects/:subjectId/exams/:examId/sections/:sectionId/edit"
          element={<TeacherSubjectExamSectionEdit />}
        />
        <Route
          path="subjects/:subjectId/exams/:examId/sections/:sectionId/questions/new"
          element={<TeacherSubjectExamQuestionCreate />}
        />
        <Route
          path="subjects/:subjectId/exams/:examId/sections/:sectionId/questions/:questionId/edit"
          element={<TeacherSubjectExamQuestionEdit />}
        />
        <Route path="subject-exams/:examId" element={<SubjectExamAttempt />} />
        <Route path="subjects/:subjectId/lessons" element={<StudentSubjectLessons />} />
        <Route path="exams" element={<StudentExams />} />
        <Route path="exams/:examId/ranking" element={<StudentExamRanking />} />
        <Route path="results" element={<StudentResults />} />
        <Route
          path="lessons/:lessonId/assessments/:assessmentId/edit"
          element={<TeacherAssessmentEdit />}
        />
        <Route
          path="lessons/:lessonId/assessments/:assessmentId/questions/new"
          element={<TeacherQuestionCreate />}
        />
        <Route
          path="lessons/:lessonId/assessments/:assessmentId/questions/:questionId/edit"
          element={<TeacherQuestionEdit />}
        />
        <Route path="grading" element={<TeacherGradingQueue />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="my-attendance" element={<StudentAttendance />} />
        <Route path="children/attendance" element={<ParentAttendance />} />
        <Route path="children/results" element={<ParentResults />} />
        <Route path="children/:childId/attendance" element={<ParentAttendance />} />
        <Route path="children/:childId" element={<ParentChildScores />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/password" element={<ChangePassword />} />
      </Route>
    </Routes>
  )
}
