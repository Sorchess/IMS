import {type ChangeEvent, useState} from "react";

interface UseFileUploadReturn {
    file: File | null;
    handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
    resetFile: () => void;
}

const useFileUpload = (): UseFileUploadReturn => {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            console.log('Файл не выбраны');
            return;
        }
        setFile(file);
    }

    const resetFile = () => {
        setFile(null);
    }

    return { file, handleFileChange, resetFile };
};

export default useFileUpload;