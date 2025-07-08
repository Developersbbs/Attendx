import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Clock,
  Users,
  CheckCircle,
  Calendar,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// Logo Component

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header with Logo */}
      <header className="container mx-auto px-4 pt-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/assets/attendx.png"
              alt="Attendex Logo"
              width={48}
              height={48}
            />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-blue-500" >Attendex</h1>
              <p className="text-xs text-blue-500 font-medium">Powered by SBBS</p>
            </div>
          </div>
          <Link href="/login"><Button>Get Started</Button></Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container h-[calc(100vh-72px)] flex items-center justify-center mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Modern Attendance & Meeting Attendance
            <span className="text-blue-600"> Made Simple</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your workforce management with our all-in-one solution
            for attendance tracking, meeting schedules, and team attendance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
