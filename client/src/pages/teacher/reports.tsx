import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AttendanceChart from "@/components/charts/attendance-chart";
import { Download, FileSpreadsheet, FileText, Calendar, TrendingUp, Users, UserCheck } from "lucide-react";

export default function ReportsScreen() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState("");
  const [reportType, setReportType] = useState("attendance");
  const [dateRange, setDateRange] = useState("month");

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });

  const reportTypes = [
    { value: "attendance", label: "Attendance Report" },
    { value: "performance", label: "Performance Report" },
    { value: "summary", label: "Class Summary" },
  ];

  const dateRanges = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "semester", label: "This Semester" },
    { value: "custom", label: "Custom Range" },
  ];

  const mockStats = {
    totalClasses: 24,
    averageAttendance: 87.5,
    totalStudents: 245,
    presentToday: 198,
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      
      <div className="flex-1 overflow-y-auto">
        <Header
          title="Reports & Analytics"
          subtitle="Generate attendance reports and view analytics"
        />

        <main className="p-6">
          {/* Report Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Report Type
                  </label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Class
                  </label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes?.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.code} - {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date Range
                  </label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button className="w-full bg-ustp-navy hover:bg-ustp-navy-light">
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Classes</p>
                    <p className="text-2xl font-bold text-slate-900">{mockStats.totalClasses}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg. Attendance</p>
                    <p className="text-2xl font-bold text-green-600">{mockStats.averageAttendance}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Students</p>
                    <p className="text-2xl font-bold text-slate-900">{mockStats.totalStudents}</p>
                  </div>
                  <Users className="w-8 h-8 text-slate-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Present Today</p>
                    <p className="text-2xl font-bold text-ustp-navy">{mockStats.presentToday}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-ustp-navy" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Export Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Attendance Trends */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Attendance Trends</h3>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Chart
                  </Button>
                </div>
                <div className="h-64">
                  <AttendanceChart />
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Options</h3>
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileSpreadsheet className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-medium text-slate-900">Excel Report</p>
                          <p className="text-sm text-slate-600">Detailed attendance data in spreadsheet format</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-red-600" />
                        <div>
                          <p className="font-medium text-slate-900">PDF Report</p>
                          <p className="text-sm text-slate-600">Formatted report with charts and summaries</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-ustp-navy" />
                        <div>
                          <p className="font-medium text-slate-900">Summary Report</p>
                          <p className="text-sm text-slate-600">Condensed overview with key metrics</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-ustp-navy hover:bg-ustp-navy-light">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Reports</h3>
              <div className="space-y-3">
                {[
                  { name: "CS 101 - Attendance Report", date: "2024-12-14", type: "PDF" },
                  { name: "All Classes - Monthly Summary", date: "2024-12-13", type: "Excel" },
                  { name: "CS 201 - Performance Report", date: "2024-12-12", type: "PDF" },
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {report.type === "PDF" ? (
                        <FileText className="w-5 h-5 text-red-600" />
                      ) : (
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{report.name}</p>
                        <p className="text-sm text-slate-600">{report.date}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
