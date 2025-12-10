"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { FileObject } from "@supabase/storage-js";
import Image from "next/image";

interface IconSelectProps extends React.ComponentPropsWithoutRef<"div"> {
    onSelectionChange?: (selectedId: string) => void;
}
const supabase = createClient();
export function IconSelect({
    onSelectionChange,
    className,
    ...props
}: IconSelectProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<FileObject[] | null>(null);
    //bring images from supabase storage
    useEffect(() => {
        const fetchImages = async () => {
            const { data, error } = await supabase.storage.from('foodPhotos').list('', {
                limit: 100,
                offset: 0,
            });
            setData(data);
            setError(error);
        };

        fetchImages();
    }, []);
    // console.log("data from supabase storage - ", data);

return (
    <div className={cn("grid grid-cols-4 gap-4", className)} {...props}>
        {error && <p>Error: {error.message}</p>}
        {data?.map((file, index) => {
            const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/foodPhotos/${file.name}`;
            return (
                <div key={file.id || index} className="flex flex-col items-center space-y-2">
                    <div className="relative">
                        <div className="w-16 h-16 bg-neutral-100 rounded-lg p-2 border-2 border-transparent hover:border-blue-300 transition-colors cursor-pointer"
                            style={{
                                borderColor: selectedOption === file.name ? '#3b82f6' : 'transparent'
                            }}
                            onClick={() => {
                                const newSelection = selectedOption === file.name ? null : file.name;
                                setSelectedOption(newSelection);
                                onSelectionChange?.(newSelection ? imageUrl : '');
                            }}
                        >
                            <Image 
                                src={imageUrl}
                                alt={file.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <Checkbox
                            className="absolute -top-1 -right-1 bg-white rounded-full border border-gray-400 shadow-sm w-4 h-4"
                            checked={selectedOption === file.name}
                            onCheckedChange={(checked) => {
                                const newSelection = checked ? file.name : null;
                                setSelectedOption(newSelection);
                                onSelectionChange?.(newSelection ? imageUrl : '');
                            }}
                        />
                    </div>
                    <span className="text-xs text-center text-gray-600">{file.name}</span>
                </div>
            );
        })}
    </div>
);
}
