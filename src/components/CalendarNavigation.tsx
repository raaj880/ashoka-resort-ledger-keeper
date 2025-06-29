import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  CalendarDays,
  Clock,
  Users,
  Home,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { format, isToday, isTomorrow, addDays } from "date-fns";

interface CalendarNavigationProps {
  onNavigateToCalendar: () => void;
  onNavigateToBookings: () => void;
  roomStats?: {
    totalRooms: number;
    occupiedToday: number;
    availableToday: number;
    checkInsToday: number;
    checkOutsToday: number;
  };
}

const CalendarNavigation = ({ 
  onNavigateToCalendar, 
  onNavigateToBookings,
  roomStats = {
    totalRooms: 0,
    occupiedToday: 0,
    availableToday: 0,
    checkInsToday: 0,
    checkOutsToday: 0
  }
}: CalendarNavigationProps) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const occupancyRate = roomStats.totalRooms > 0 
    ? (roomStats.occupiedToday / roomStats.totalRooms) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Rooms</p>
                <p className="text-2xl font-bold text-blue-700">{roomStats.totalRooms}</p>
              </div>
              <Home className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Available Today</p>
                <p className="text-2xl font-bold text-emerald-700">{roomStats.availableToday}</p>
              </div>
              <Calendar className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Occupied Today</p>
                <p className="text-2xl font-bold text-red-700">{roomStats.occupiedToday}</p>
              </div>
              <Users className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Occupancy Rate</p>
                <p className="text-2xl font-bold text-purple-700">{occupancyRate.toFixed(0)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Today's Activity - {format(today, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-emerald-700">Check-ins Today</h4>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600">Expected Arrivals</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {roomStats.checkInsToday}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Check-outs Today</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-600">Expected Departures</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {roomStats.checkOutsToday}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={onNavigateToCalendar}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Room Calendar</h3>
                <p className="text-gray-600">View and manage room availability</p>
                <p className="text-sm text-blue-600 mt-1">Click to open calendar view</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={onNavigateToBookings}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Manage Bookings</h3>
                <p className="text-gray-600">Handle reservations and guests</p>
                <p className="text-sm text-emerald-600 mt-1">Click to manage bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      {(roomStats.checkInsToday > 0 || roomStats.checkOutsToday > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Today's Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roomStats.checkInsToday > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm">
                    {roomStats.checkInsToday} guest{roomStats.checkInsToday !== 1 ? 's' : ''} checking in today
                  </span>
                </div>
              )}
              {roomStats.checkOutsToday > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">
                    {roomStats.checkOutsToday} guest{roomStats.checkOutsToday !== 1 ? 's' : ''} checking out today
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarNavigation;