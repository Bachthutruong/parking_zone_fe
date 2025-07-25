import type { ParkingType, AddonService } from './types';
import { Building, Sun, Accessibility, Car, Luggage, Wind, Sparkles, Plane } from 'lucide-react';

export const parkingTypes: ParkingType[] = [
  { id: 'indoor', name: 'Trong nhà', icon: Building, basePrice: 100 },
  { id: 'outdoor', name: 'Ngoài trời', icon: Sun, basePrice: 80 },
  { id: 'disabled', name: 'Khu vực dành cho người khuyết tật', icon: Accessibility, basePrice: 80 },
];

export const addonServices: (Omit<AddonService, 'id'> & { id: string, icon: any})[] = [
  { id: 'shuttle', name: 'Đưa đón sân bay', price: 0, icon: Plane },
  { id: 'luggage', name: 'Ký gửi đồ', price: 0, icon: Luggage },
  { id: 'wash', name: 'Rửa xe', price: 300, icon: Car },
  { id: 'polish', name: 'Đánh bóng & chăm sóc ngoại thất', price: 800, icon: Sparkles },
  { id: 'disinfect', name: 'Khử trùng nội thất', price: 500, icon: Wind },
];

export const regulations = `
<h3 class="font-bold text-lg mb-2">Quy định và Lưu ý Quan trọng</h3>
<ul class="list-disc pl-5 space-y-1">
  <li>Vui lòng đến trước giờ bay ít nhất 3 tiếng để làm thủ tục gửi xe.</li>
  <li>Chúng tôi không chịu trách nhiệm về tài sản cá nhân để lại trong xe.</li>
  <li>Phí đậu xe được tính tròn ngày. Thời gian vào và ra sẽ được dùng để xác định số ngày đậu.</li>
  <li>Quý khách vui lòng kiểm tra tình trạng xe cẩn thận trước khi rời bãi.</li>
  <li>Việc thay đổi hoặc hủy đặt chỗ phải được thực hiện ít nhất 24 giờ trước thời gian vào bãi dự kiến.</li>
</ul>
`;
