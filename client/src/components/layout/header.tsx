import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-slate-600">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          {actions}
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
            <Bell className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}
