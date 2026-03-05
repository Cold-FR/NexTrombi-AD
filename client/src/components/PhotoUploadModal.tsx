import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { type User } from './UserCard';

interface PhotoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (userId: string, file: File) => void;
}

export default function PhotoUploadModal({ isOpen, onClose, user, onSave }: PhotoUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setPreviewUrl(user?.photoUrl || null);
            setSelectedFile(null);
        }
    }, [isOpen, user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = () => {
        if (user && selectedFile) {
            onSave(user.id, selectedFile);
            onClose();
        }
    };

    if (!isOpen || !user) return null;

    const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

    return (
        // OVERLAY (Fond sombre avec léger effet de flou)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-opacity">

            {/* BOÎTE MODALE */}
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER (Style formulaire-ad) */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Photo de profil
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6">
                    <div className="flex flex-col items-center mb-6">

                        {/* AVATAR PREVIEW */}
                        <div className="relative mb-6">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Aperçu"
                                    className="w-28 h-28 rounded-full object-cover border-4 border-gray-50 dark:border-gray-700 shadow-sm"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-50 dark:border-gray-600 shadow-sm">
                                    <span className="text-3xl font-medium text-gray-600 dark:text-gray-300">{initials}</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-primary-600 text-white p-2.5 rounded-full shadow-lg ring-4 ring-white dark:ring-gray-800">
                                <Upload size={16} />
                            </div>
                        </div>

                        {/* INPUT FILE FLOWBITE NATIF */}
                        <div className="w-full">
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="file_input">
                                Sélectionner un fichier
                            </label>
                            <input
                                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 transition-colors"
                                id="file_input"
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleFileChange}
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Formats acceptés : JPG, PNG, WEBP (Max. 2Mo).
                            </p>
                        </div>
                    </div>

                    {/* FOOTER / ACTIONS */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary-700 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedFile}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-primary-800 transition-colors"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}