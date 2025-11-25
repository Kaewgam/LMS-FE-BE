'use client';

import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

// ---------- ConfirmationModal ----------
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  disabled?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  disabled = false,
}) => {
  if (!isOpen) return null;
  const isDeleteAction = title.includes('ลบ');
  const confirmButtonColor = isDeleteAction
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer"
            disabled={disabled}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50"
            disabled={disabled}
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className={`py-2 px-4 text-white rounded-lg font-semibold transition-colors ${confirmButtonColor} cursor-pointer disabled:opacity-50`}
            disabled={disabled}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- AddOrganizationModal ----------
interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
  disabled?: boolean;
}

const AddOrganizationModal: React.FC<AddOrganizationModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  disabled = false,
}) => {
  const [orgName, setOrgName] = useState('');

  const handleAddClick = () => {
    if (orgName.trim()) {
      onAdd(orgName.trim());
      setOrgName('');
      onClose();
    } else {
      toast.error('กรุณาใส่ชื่อองค์กร');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-300">
        <h3 className="text-xl font-semibold mb-4">เพิ่มองค์กรใหม่</h3>
        <div className="mb-4">
          <label htmlFor="orgName" className="block text-sm font-medium">
            ชื่อองค์กร
          </label>
          <input
            type="text"
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="mt-1 py-2 px-5 block w-full rounded-md border border-gray-300"
            disabled={disabled}
          />
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-6 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50"
            disabled={disabled}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleAddClick}
            className="py-2 px-8 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
            disabled={disabled}
          >
            เพิ่ม
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Types ----------
interface Organization {
  id: string;          // ถ้า backend เป็นตัวเลข เปลี่ยนเป็น number ได้เลย
  name: string;
  created_at?: string;
}

// ---------- Page ----------
const OrganizationManagementPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editingOrgName, setEditingOrgName] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // ------ API ------
  async function loadOrganizations() {
    setLoading(true);
    try {
      const res = await api.get('/admin/listorganizations/');
      setOrganizations(res.data as Organization[]);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'โหลดรายการองค์กรไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  // ------ UI handlers ------
  const openConfirmationModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
    });
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (org: Organization) => {
    setEditingOrgId(org.id);
    setEditingOrgName(org.name);
  };

  const handleSaveEdit = async (orgId: string) => {
    const newName = editingOrgName.trim();
    if (!newName) {
      toast.error('ชื่อองค์กรต้องไม่ว่างเปล่า');
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch(`/admin/listorganizations/${orgId}/`, { name: newName });
      setOrganizations((prev) => prev.map((o) => (o.id === orgId ? (res.data as Organization) : o)));
      toast.success('บันทึกชื่อองค์กรเรียบร้อยแล้ว');
      setEditingOrgId(null);
      setEditingOrgName('');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingOrgId(null);
    setEditingOrgName('');
  };

  const handleDelete = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (!org) return;

    openConfirmationModal(
      'ยืนยันการลบองค์กร',
      `คุณแน่ใจหรือไม่ว่าต้องการลบองค์กร " ${org.name} " การกระทำนี้ไม่สามารถย้อนกลับได้`,
      async () => {
        setLoading(true);
        try {
          await api.delete(`/admin/listorganizations/${orgId}/`);
          setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
          toast.success(`ลบองค์กร " ${org.name} " เรียบร้อยแล้ว`);
        } catch (e: any) {
          toast.error(e?.response?.data?.detail || 'ลบองค์กรไม่สำเร็จ');
        } finally {
          setLoading(false);
          closeConfirmationModal();
        }
      }
    );
  };

  const handleAddOrganization = async (name: string) => {
    const isDuplicate = organizations.some(
      (org) => org.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error('ไม่สามารถเพิ่มได้ ชื่อองค์กรนี้มีอยู่ในระบบแล้ว');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/listorganizations/', { name: name.trim() });
      setOrganizations((prev) => [res.data as Organization, ...prev]); // แทรกบนสุด
      toast.success(`เพิ่มองค์กร "${name}" เรียบร้อยแล้ว`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'เพิ่มองค์กรไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const renderCardButtons = (org: Organization) => (
    <div className="flex justify-end gap-2 text-right">
      {editingOrgId === org.id ? (
        <>
          <button
            onClick={() => handleSaveEdit(org.id)}
            className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors duration-150 cursor-pointer disabled:opacity-50"
            title="บันทึก"
            disabled={loading}
          >
            <CheckIcon className="w-4 h-4" />
            <span>บันทึก</span>
          </button>
          <button
            onClick={handleCancelEdit}
            className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors duration-150 cursor-pointer disabled:opacity-50"
            title="ยกเลิก"
            disabled={loading}
          >
            <XMarkIcon className="w-4 h-4" />
            <span>ยกเลิก</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => handleEdit(org)}
            className="flex items-center gap-1 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
            title="แก้ไข"
            disabled={loading}
          >
            <PencilIcon className="w-4 h-4" />
            <span>แก้ไข</span>
          </button>
          <button
            onClick={() => handleDelete(org.id)}
            className="flex items-center gap-1 hover:text-black transition-colors duration-150 cursor-pointer disabled:opacity-50"
            title="ลบ"
            disabled={loading}
          >
            <TrashIcon className="w-4 h-4" />
            <span>ลบ</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans antialiased">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: '8px',
            fontSize: '16px',
            padding: '16px 24px',
            fontWeight: '600',
          },
          success: { style: { background: '#F0FDF4', color: 'black' } },
          error: { style: { background: '#FFF1F2', color: 'black' } },
        }}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        disabled={loading}
      />

      <AddOrganizationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddOrganization}
        disabled={loading}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            รายชื่อองค์กรทั้งหมด
          </h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 font-semibold cursor-pointer disabled:opacity-50"
            disabled={loading}
          >
            <PlusIcon className="w-5 h-5" />
            เพิ่มองค์กร
          </button>
        </div>

        <hr className="mt-[-10px] mb-8 border-t-2 border-gray-200" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อองค์กร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200"
            />
          </div>
        </div>

        <div className="hidden md:block overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-wider border-r border-gray-300">
                  #
                </th>
                <th className="px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-wider border-r border-gray-300">
                  ชื่อองค์กร
                </th>
                <th className="px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && organizations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-lg">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : filteredOrganizations.length > 0 ? (
                filteredOrganizations.map((org, index) => (
                  <tr key={org.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300">
                      {editingOrgId === org.id ? (
                        <input
                          type="text"
                          value={editingOrgName}
                          onChange={(e) => setEditingOrgName(e.target.value)}
                          className="w-full text-center border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                          disabled={loading}
                        />
                      ) : (
                        <span>{org.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center gap-6">
                        {editingOrgId === org.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(org.id)}
                              className="flex items-center gap-1 transition-colors duration-150 text-green-600 hover:text-green-800 cursor-pointer disabled:opacity-50"
                              title="บันทึก"
                              disabled={loading}
                            >
                              <CheckIcon className="w-4 h-4" />
                              <span>บันทึก</span>
                            </button>
                            <div className="w-px h-6 bg-gray-300" />
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1 transition-colors duration-150 text-red-600 hover:text-red-800 cursor-pointer disabled:opacity-50"
                              title="ยกเลิก"
                              disabled={loading}
                            >
                              <XMarkIcon className="w-4 h-4" />
                              <span>ยกเลิก</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(org)}
                              className="flex items-center gap-1 transition-colors duration-150 text-black cursor-pointer disabled:opacity-50"
                              title="แก้ไข"
                              disabled={loading}
                            >
                              <PencilIcon className="w-4 h-4" />
                              <span>แก้ไข</span>
                            </button>
                            <div className="w-px h-6 bg-gray-300" />
                            <button
                              onClick={() => handleDelete(org.id)}
                              className="flex items-center gap-1 transition-colors duration-150 text-black cursor-pointer disabled:opacity-50"
                              title="ลบ"
                              disabled={loading}
                            >
                              <TrashIcon className="w-4 h-4" />
                              <span>ลบ</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-lg">
                    ไม่พบข้อมูลองค์กร
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col gap-4">
          {loading && organizations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-lg">
              กำลังโหลด...
            </div>
          ) : filteredOrganizations.length > 0 ? (
            filteredOrganizations.map((org, index) => (
              <div key={org.id} className="bg-white rounded-lg shadow-md p-4 space-y-2 border border-gray-300">
                <div className="flex justify-between items-center pb-2 border-b border-gray-300">
                  {editingOrgId === org.id ? (
                    <input
                      type="text"
                      value={editingOrgName}
                      onChange={(e) => setEditingOrgName(e.target.value)}
                      className="w-full text-lg font-semibold border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      disabled={loading}
                    />
                  ) : (
                    <div className="font-semibold text-lg">{org.name}</div>
                  )}
                </div>
                <div className="text-[13px]">
                  <div className="grid grid-cols-2 gap-y-1">
                    <div>
                      <span className="font-semibold">ลำดับ :</span> {index + 1}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-300 flex justify-end gap-3 mt-4">
                  {renderCardButtons(org)}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-lg">
              ไม่พบข้อมูลองค์กร
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationManagementPage;
