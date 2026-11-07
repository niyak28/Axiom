import { useState } from "react";
import { LectureContentProvider } from "./components/contexts/LectureContent";
import { SocketProvider } from "./components/contexts/SocketContext";
import ProfessorView from "./components/pages/ProfessorView";
import StudentView from "./components/pages/StudentView";
import SummaryView from "./components/pages/SummaryView";

const views = {
  student: StudentView,
  professor: ProfessorView,
  summary: SummaryView,
};

export default function App() {
  const [activeView, setActiveView] = useState("student");
  const ActiveView = views[activeView];

  return (
    <LectureContentProvider>
      <SocketProvider>
        <ActiveView activeView={activeView} onNavigate={setActiveView} />
      </SocketProvider>
    </LectureContentProvider>
  );
}
