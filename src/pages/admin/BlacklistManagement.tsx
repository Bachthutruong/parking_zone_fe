import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAllBlacklist, createBlacklist, deleteBlacklist, updateBlacklist } from '@/services/admin';
import { formatDateTime } from '@/lib/dateUtils';

interface BlacklistItem {
  _id: string;
  phone?: string;
  licensePlate?: string;
  reason: string;
  createdAt: string;
}

const BlacklistManagement: React.FC = () => {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<BlacklistItem | null>(null);
  const [formData, setFormData] = useState({ phone: '', licensePlate: '', reason: '' });

  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      const data = await getAllBlacklist();
      setBlacklist(data.blacklist || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || '載入黑名單失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const handleOpenAddDialog = () => {
    setEditingItem(null);
    setFormData({ phone: '', licensePlate: '', reason: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (item: BlacklistItem) => {
    setEditingItem(item);
    setFormData({ 
      phone: item.phone || '', 
      licensePlate: item.licensePlate || '', 
      reason: item.reason 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.phone.trim() && !formData.licensePlate.trim()) {
      toast.error('必須提供電話或車牌號碼');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('請填寫原因');
      return;
    }

    try {
      if (editingItem) {
        await updateBlacklist(editingItem._id, {
          phone: formData.phone.trim(),
          licensePlate: formData.licensePlate.trim(),
          reason: formData.reason.trim()
        });
        toast.success('黑名單更新成功');
      } else {
        await createBlacklist({
          phone: formData.phone.trim(),
          licensePlate: formData.licensePlate.trim(),
          reason: formData.reason.trim()
        });
        toast.success('已加入黑名單');
      }
      setIsDialogOpen(false);
      fetchBlacklist();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '操作失敗');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteBlacklist(itemToDelete);
      toast.success('已從黑名單移除');
      setItemToDelete(null);
      setIsDeleteDialogOpen(false);
      fetchBlacklist();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '移除失敗');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">黑名單管理</h1>
          <p className="text-gray-500">管理禁止預約的電話號碼或車牌</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          新增黑名單
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>電話</TableHead>
                <TableHead>車牌號碼</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">載入中...</TableCell>
                </TableRow>
              ) : blacklist.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    目前沒有黑名單記錄
                  </TableCell>
                </TableRow>
              ) : (
                blacklist.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.phone || '-'}</TableCell>
                    <TableCell>{item.licensePlate || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.reason}>{item.reason}</TableCell>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setItemToDelete(item._id);
                          setIsDeleteDialogOpen(true);
                        }} className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? '編輯黑名單' : '新增黑名單'}</DialogTitle>
            <DialogDescription>
              請填寫需要加入黑名單的電話或車牌號碼（至少填寫一項）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>電話</Label>
              <Input
                placeholder="例如: 0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>車牌號碼</Label>
              <Input
                placeholder="例如: ABC-1234"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>原因 (必填)</Label>
              <Input
                placeholder="請輸入原因"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要移除嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作將把該對象從黑名單中移除，此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              確定移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlacklistManagement;
