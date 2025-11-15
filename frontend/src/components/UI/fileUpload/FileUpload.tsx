import {useEffect, useRef} from "react";
import useFileUpload from "../../../hooks/useFileUpload.ts";
import SButton from "../small_button/SButton.tsx";

interface FileUploadProps {
    onFileChange?: (file: File | null) => void;
}

const FileUploadButton = (props: FileUploadProps) => {
    const { onFileChange } = props;
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { file, handleFileChange } = useFileUpload();

    const openDialog = () => {
        inputRef.current?.click();
    };

    useEffect(() => {
        onFileChange?.(file);
    }, [file]);

    return (
        <div>
            <SButton onClick={openDialog}>
                <i className="fa-solid fa-upload" />
            </SButton>

            <input
                ref={inputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default FileUploadButton;