import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock, Info } from 'lucide-react';

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
        return 'Tất cả các ngày trong khoảng thời gian đã chọn đều đã có người đặt. Vui lòng chọn khoảng thời gian khác.';
      case 'major':
        return 'Phần lớn các ngày trong khoảng thời gian đã chọn đã có người đặt. Chỉ còn một số ngày trống.';
      case 'minor':
        return 'Một số ngày trong khoảng thời gian đã chọn đã có người đặt.';
      default:
        return 'Có xung đột lịch đặt chỗ.';
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
          <span>Thông báo xung đột lịch</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Tóm tắt:</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {availableDays} ngày trống
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {conflictingDays.length} ngày đã đặt
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
            Khoảng thời gian: {formatDate(checkInTime)} - {formatDate(checkOutTime)}
          </span>
        </div>

        {/* Conflicting Days */}
        <div>
          <h4 className="font-medium mb-2">Các ngày đã có người đặt:</h4>
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
          <h4 className="font-medium mb-2">Gợi ý:</h4>
          <ul className="text-sm space-y-1">
            {conflictType === 'full' && (
              <li>• Chọn khoảng thời gian khác hoàn toàn</li>
            )}
            {conflictType === 'major' && (
              <>
                <li>• Chọn khoảng thời gian ngắn hơn</li>
                <li>• Chọn khoảng thời gian khác</li>
              </>
            )}
            {conflictType === 'minor' && (
              <>
                <li>• Có thể đặt chỗ cho các ngày còn trống</li>
                <li>• Hoặc chọn khoảng thời gian khác</li>
              </>
            )}
            <li>• Liên hệ chúng tôi để được hỗ trợ</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConflictNotification; 