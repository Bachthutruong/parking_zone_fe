import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock, Info } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

interface ConflictNotificationProps {
  checkInTime: string;
  checkOutTime: string;
  conflictingDays: string[];
  totalDays: number;
  availableDays: number;
}

const ConflictNotification: React.FC<ConflictNotificationProps> = ({
  checkInTime,
  checkOutTime,
  conflictingDays,
  totalDays,
  availableDays
}) => {
  if (conflictingDays.length === 0) {
    return null;
  }

  // Date formatting function is now imported from dateUtils

  const getConflictType = () => {
    if (conflictingDays.length === totalDays) {
      return 'full';
    } else if (conflictingDays.length > totalDays / 2) {
      return 'major';
    } else {
      return 'minor';
    }
  };

  const conflictType = getConflictType();

  const getConflictMessage = () => {
    switch (conflictType) {
      case 'full':
        return '所選時間範圍內的所有日期都已被預約。請選擇其他時間範圍。';
      case 'major':
        return '所選時間範圍內的大部分日期已被預約。只剩下少數空閒日期。';
      case 'minor':
        return '所選時間範圍內的部分日期已被預約。';
      default:
        return '預約時間有衝突。';
    }
  };

  const getConflictColor = () => {
    switch (conflictType) {
      case 'full':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'major':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'minor':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <Card className={`border-2 ${getConflictColor()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <AlertTriangle className="h-5 w-5" />
          <span>時間衝突通知</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">摘要:</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {availableDays} 天空閒
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {conflictingDays.length} 天已預約
            </Badge>
          </div>
        </div>

        {/* Message */}
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{getConflictMessage()}</p>
        </div>

        {/* Time Range */}
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>
            時間範圍: {formatDate(checkInTime)} - {formatDate(checkOutTime)}
          </span>
        </div>

        {/* Conflicting Days */}
        <div>
          <h4 className="font-medium mb-2">已被預約的日期:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {conflictingDays.map((day, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{formatDate(day)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white/50 p-3 rounded-lg">
          <h4 className="font-medium mb-2">建議:</h4>
          <ul className="text-sm space-y-1">
            {conflictType === 'full' && (
              <li>• 選擇完全不同的時間範圍</li>
            )}
            {conflictType === 'major' && (
              <>
                <li>• 選擇較短的時間範圍</li>
                <li>• 選擇其他時間範圍</li>
              </>
            )}
            {conflictType === 'minor' && (
              <>
                <li>• 可以預約剩餘的空閒日期</li>
                <li>• 或選擇其他時間範圍</li>
              </>
            )}
            <li>• 聯繫我們以獲得支援</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConflictNotification; 