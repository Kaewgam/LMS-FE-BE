'use client';

import React, { useState, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { MagnifyingGlassIcon, BuildingLibraryIcon, PencilIcon, TrashIcon, NoSymbolIcon, CheckCircleIcon, ExclamationTriangleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// --- Interfaces ---
interface Institution {
    id: number;
    name: string;
    domain: string;
    lastContact: Date;
    status: 'Active' | 'Archived';
}

// --- Modal for Adding Institution ---
const AddInstitutionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string, domain: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const [name, setName] = useState('');
    const [domain, setDomain] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim() || !domain.trim()) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        onConfirm(name, domain);
        setName('');
        setDomain('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-xl font-semibold">เพิ่มสถาบันใหม่</h2>
                    <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลสถาบันที่ต้องการเพิ่มเข้าสู่ระบบ</p>
                </div>
                <div className="p-6 pt-0 space-y-4">
                    <div>
                        <label htmlFor="inst-name" className="block text-sm font-medium  mb-1">ชื่อสถาบัน</label>
                        <input
                            type="text"
                            id="inst-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ชื่อสถาบัน"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="inst-domain" className="block text-sm font-medium  mb-1">Email Domain</label>
                        <input
                            type="text"
                            id="inst-domain"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="domainname.ac.th"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-400"
                        />
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg  border-t flex justify-end gap-3">
                    <button onClick={onClose} className="py-2 px-4 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-colors cursor-pointer">
                        ยกเลิก
                    </button>
                    <button onClick={handleSubmit} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer">
                        เพิ่มสถาบัน
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Confirmation Modal ---
const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    const isDeleteAction = title.includes('ลบ');
    const confirmButtonColor = isDeleteAction ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';
    return (
        <div className="fixed inset-0 flex justify-center items-center z-50  bg-opacity-40 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer">
                        ยกเลิก
                    </button>
                    <button onClick={onConfirm} className={`py-2 px-4 text-white rounded-lg font-semibold transition-colors ${confirmButtonColor} cursor-pointer`}>
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
const HandleInstitutionsPage: React.FC = () => {
    const initialInstitutions: Institution[] = [
        { id: 1, name: "King Mongkut's Institute of Technology Ladkrabang", domain: 'kmitl.ac.th', lastContact: new Date('2024-01-15T17:30:00'), status: 'Active' },
        { id: 2, name: 'Chulalongkorn University', domain: 'chula.ac.th', lastContact: new Date('2024-01-25T09:00:00'), status: 'Active' },
        { id: 3, name: 'Mahidol University', domain: 'mahidol.ac.th', lastContact: new Date('2024-01-30T10:30:00'), status: 'Active' },
        { id: 4, name: 'Thammasat University', domain: 'tu.ac.th', lastContact: new Date('2024-02-05T14:00:00'), status: 'Active' },
        { id: 5, name: 'Kasetsart University', domain: 'ku.ac.th', lastContact: new Date('2024-02-10T11:00:00'), status: 'Active' },
        { id: 6, name: "King Prajadhipok's Institute", domain: 'kpi.ac.th', lastContact: new Date('2024-02-15T13:30:00'), status: 'Active' },
        { id: 7, name: 'Bangkok University', domain: 'bangkok.ac.th', lastContact: new Date('2024-02-20T12:00:00'), status: 'Active' },
        { id: 8, name: 'Srinakharinwirot University', domain: 'swu.ac.th', lastContact: new Date('2024-02-25T15:00:00'), status: 'Archived' },
        { id: 9, name: 'Sukhothai Thammathirat Open University', domain: 'stou.ac.th', lastContact: new Date('2023-12-01T16:00:00'), status: 'Active' },
        { id: 10, name: 'Prince of Songkla University', domain: 'psu.ac.th', lastContact: new Date('2023-12-05T09:30:00'), status: 'Active' },
    ];

    const [institutions, setInstitutions] = useState<Institution[]>(initialInstitutions);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'Active' | 'Archived' | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    
    const [editingInstId, setEditingInstId] = useState<number | null>(null);
    const [editingValues, setEditingValues] = useState({ name: '', domain: '' });

    const itemsPerPage = 10;

    const openConfirmationModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmationModal({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmationModal = () => {
        setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    };

    const filteredInstitutions = useMemo(() => {
        return institutions
            .filter(inst => (filter === 'All' || inst.status === filter))
            .filter(inst => inst.name.toLowerCase().includes(searchTerm.toLowerCase()) || inst.domain.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [institutions, searchTerm, filter]);

    const paginatedInstitutions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredInstitutions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredInstitutions, currentPage]);

    const totalPages = Math.ceil(filteredInstitutions.length / itemsPerPage);

    const stats = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return {
            total: institutions.length,
            addedRecently: institutions.filter(inst => inst.lastContact > sevenDaysAgo).length,
            archived: institutions.filter(inst => inst.status === 'Archived').length,
        };
    }, [institutions]);
    
    const handleAdd = () => setIsAddModalOpen(true);
    
    const handleEdit = (inst: Institution) => {
        setEditingInstId(inst.id);
        setEditingValues({ name: inst.name, domain: inst.domain });
    };

    const handleCancelEdit = () => {
        setEditingInstId(null);
    };

    const handleSaveEdit = (id: number) => {
        if (!editingValues.name.trim() || !editingValues.domain.trim()) {
            toast.error('ชื่อและโดเมนต้องไม่เป็นค่าว่าง');
            return;
        }
        setInstitutions(prev => prev.map(i => 
            i.id === id ? { ...i, name: editingValues.name.trim(), domain: editingValues.domain.trim(), lastContact: new Date() } : i
        ));
        setEditingInstId(null);
        toast.success('บันทึกการแก้ไขเรียบร้อยแล้ว');
    };
    
    const handleDelete = (inst: Institution) => {
        openConfirmationModal('ยืนยันการลบสถาบัน', `คุณแน่ใจหรือไม่ว่าต้องการลบสถาบัน "${inst.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`, () => {
            setInstitutions(prev => prev.filter(i => i.id !== inst.id));
            toast.error(`ลบสถาบัน "${inst.name}" เรียบร้อยแล้ว`);
            closeConfirmationModal();
        });
    };

    const handleSuspend = (inst: Institution) => {
        const isSuspending = inst.status === 'Active';
        const actionText = isSuspending ? 'ระงับ' : 'กู้คืน';
        openConfirmationModal(`ยืนยันการ${actionText}สถาบัน`, `คุณแน่ใจหรือไม่ว่าต้องการ${actionText}สถาบัน "${inst.name}"?`, () => {
            setInstitutions(prev => prev.map(i => i.id === inst.id ? { ...i, status: isSuspending ? 'Archived' : 'Active' } : i));
            toast.success(`เปลี่ยนสถานะสถาบัน "${inst.name}" เรียบร้อยแล้ว`);
            closeConfirmationModal();
        });
    };
    
    const handleConfirmAdd = (name: string, domain: string) => {
        const trimmedName = name.trim();
        const trimmedDomain = domain.trim().toLowerCase();
        const isDuplicateName = institutions.some(inst => inst.name.toLowerCase() === trimmedName.toLowerCase());
        if (isDuplicateName) { toast.error('มีสถาบันชื่อนี้อยู่ในระบบแล้ว'); return; }
        const isDuplicateDomain = institutions.some(inst => inst.domain.toLowerCase() === trimmedDomain);
        if (isDuplicateDomain) { toast.error('มีโดเมนนี้อยู่ในระบบแล้ว'); return; }
        const newInstitution: Institution = { id: Date.now(), name: trimmedName, domain: trimmedDomain, lastContact: new Date(), status: 'Active' };
        setInstitutions(prev => [newInstitution, ...prev]);
        setIsAddModalOpen(false);
        toast.success(`เพิ่มสถาบัน "${trimmedName}" เรียบร้อยแล้ว`);
    };

    const formatDate = (date: Date) => date.toLocaleString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const StatCard = ({ title, value, description, icon }: { title: string, value: number, description: string, icon: React.ReactNode }) => (
        <div className="bg-white p-5 rounded-lg shadow-sm border flex items-start justify-between">
            <div>
                <p className=" text-sm">{title}</p>
                <p className="text-3xl font-semibold mt-1">{value}</p>
                <p className="text-sm  mt-2">{description}</p>
            </div>
            <div className="">{icon}</div>
        </div>
    );
    
    const Pagination = () => (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 disabled:opacity-50 cursor-pointer">&lt;</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-md text-sm cursor-pointer ${currentPage === page ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    {page}
                </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 disabled:opacity-50 cursor-pointer">&gt;</button>
        </div>
    );

    return (
        <div className="p-4 sm:p-8 min-h-screen font-sans">
            <Toaster position="top-center" reverseOrder={false} />
            <AddInstitutionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleConfirmAdd} />
            <ConfirmationModal isOpen={confirmationModal.isOpen} onClose={closeConfirmationModal} onConfirm={confirmationModal.onConfirm} title={confirmationModal.title} message={confirmationModal.message} />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold">จัดการสถาบัน</h1>
                        <p className="text-sm text-gray-500 mt-1">จัดการข้อมูลสถาบันที่ใช้งานในระบบ LMS</p>
                    </div>
                    <button onClick={handleAdd} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                        + เพิ่มสถาบัน
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard title="สถาบันทั้งหมด" value={stats.total} description="สถาบันทั้งหมด" icon={<BuildingLibraryIcon className="w-6 h-6" />} />
                    <StatCard title="เพิ่มเมื่อเร็วๆนี้" value={stats.addedRecently} description="สถาบันที่เพิ่มในระยะ 7 วันที่ผ่านมา" icon={<BuildingLibraryIcon className="w-6 h-6" />} />
                    <StatCard title="สถาบันที่ถูกระงับ" value={stats.archived} description="สถาบันทั้งหมดที่ถูกระงับการใช้งาน" icon={<BuildingLibraryIcon className="w-6 h-6" />} />
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-auto flex-grow">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="ค้นหาสถาบัน หรือโดเมน" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                        </div>
                        <div className="flex items-center gap-2">
                            {(['All', 'Active', 'Archived'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100  hover:bg-gray-200'}`}>
                                    {f === 'All' ? 'ทั้งหมด' : f === 'Active' ? 'ล่าสุด' : 'ถูกระงับ'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* --- Desktop Table View --- */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <table className="w-full text-sm">
                        {/* ... Table Head ... */}
                        <thead className="bg-gray-50">
                            <tr className="text-left text-black">
                                <th className="p-3 font-semibold">ชื่อสถาบัน</th>
                                <th className="p-3 font-semibold">Email Domain</th>
                                <th className="p-3 font-semibold">อัปเดตล่าสุด</th>
                                <th className="p-3 font-semibold text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedInstitutions.map(inst => (
                                <tr key={inst.id} className={`hover:bg-gray-50 ${inst.status === 'Archived' ? 'text-red-600' : 'text-black'}`}>
                                    <td className="p-3 font-medium">
                                        {editingInstId === inst.id ? (
                                            <input type="text" value={editingValues.name} onChange={(e) => setEditingValues(prev => ({ ...prev, name: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded-md" autoFocus />
                                        ) : (
                                            <div className="flex items-center gap-3"><BuildingLibraryIcon className="w-5 h-5" />{inst.name}</div>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {editingInstId === inst.id ? (
                                             <input type="text" value={editingValues.domain} onChange={(e) => setEditingValues(prev => ({ ...prev, domain: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded-md" />
                                        ) : (
                                            <span className="bg-gray-100 px-2 py-1 rounded-md">{inst.domain}</span>
                                        )}
                                    </td>
                                    <td className="p-3">{formatDate(inst.lastContact)}</td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-center gap-4 text-sm">
                                            {editingInstId === inst.id ? (<>
                                                <button onClick={() => handleSaveEdit(inst.id)} className="flex items-center gap-1 text-green-600 cursor-pointer"><CheckIcon className="w-4 h-4" /><span>บันทึก</span></button>
                                                <button onClick={handleCancelEdit} className="flex items-center gap-1 text-red-600 cursor-pointer"><XMarkIcon className="w-4 h-4" /><span>ยกเลิก</span></button>
                                            </>) : (<>
                                                <button onClick={() => handleEdit(inst)} className="flex items-center gap-1 cursor-pointer"><PencilIcon className="w-4 h-4" /><span>แก้ไข</span></button>
                                                <button onClick={() => handleSuspend(inst)} className="flex items-center gap-1 cursor-pointer">
                                                    {inst.status === 'Active' ? <NoSymbolIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                                    <span>{inst.status === 'Active' ? 'ระงับ' : 'กู้คืน'}</span>
                                                </button>
                                                <button onClick={() => handleDelete(inst)} className="flex items-center gap-1 cursor-pointer"><TrashIcon className="w-4 h-4" /><span>ลบ</span></button>
                                            </>)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

{/* --- Mobile Card View --- */}
                <div className="md:hidden flex flex-col gap-4">
                    {paginatedInstitutions.map(inst => (
                        <div key={inst.id} className={`bg-white rounded-lg shadow-sm border p-4 space-y-3 ${inst.status === 'Archived' ? 'border-red-400' : 'border-gray-200'}`}>
                             {editingInstId === inst.id ? (
                                <div className="space-y-2">
                                    <input type="text" value={editingValues.name} onChange={(e) => setEditingValues(prev => ({ ...prev, name: e.target.value }))} className="w-full font-semibold text-lg px-2 py-1 border rounded-md" autoFocus />
                                    <input type="text" value={editingValues.domain} onChange={(e) => setEditingValues(prev => ({ ...prev, domain: e.target.value }))} className="w-full text-sm px-2 py-1 border rounded-md" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg break-words">{inst.name}</h3>
                                    <p className="text-sm"><span className="bg-gray-100 text-black px-2 py-1 rounded-md">{inst.domain}</span></p>
                                </div>
                            )}

                            <div className="text-xs pt-3 border-t">
                                <span className="font-semibold">อัปเดตล่าสุด:</span> {formatDate(inst.lastContact)}
                            </div>

                            <div className="border-t pt-3 flex justify-end gap-4 text-xs">
                                {editingInstId === inst.id ? (<>
                                    <button onClick={() => handleSaveEdit(inst.id)} className="flex items-center gap-1 text-green-600 cursor-pointer"><CheckIcon className="w-4 h-4" /><span>บันทึก</span></button>
                                    <button onClick={handleCancelEdit} className="flex items-center gap-1  text-red-600 cursor-pointer"><XMarkIcon className="w-4 h-4" /><span>ยกเลิก</span></button>
                                </>) : (<>
                                    <button onClick={() => handleEdit(inst)} className="flex items-center gap-1 cursor-pointer"><PencilIcon className="w-4 h-4" /><span>แก้ไข</span></button>
                                    <button onClick={() => handleSuspend(inst)} className={`flex items-center gap-1 cursor-pointer ${inst.status === 'Archived' ? 'text-red-600' : ''}`}>
                                        {inst.status === 'Active' ? <NoSymbolIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                        <span>{inst.status === 'Active' ? 'ระงับ' : 'กู้คืน'}</span>
                                    </button>
                                    <button onClick={() => handleDelete(inst)} className="flex items-center gap-1 cursor-pointer"><TrashIcon className="w-4 h-4" /><span>ลบ</span></button>
                                </>)}
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && <Pagination />}
            </div>
        </div>
    );
};

export default HandleInstitutionsPage;