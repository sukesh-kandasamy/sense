import { Loader2 } from "lucide-react";

interface LoaderProps {
    fullScreen?: boolean;
    text?: string;
    className?: string;
}

export function Loader({ fullScreen = false, text, className = "" }: LoaderProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                {text && <p className="text-muted-foreground text-lg animate-pulse">{text}</p>}
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            {text && <p className="text-muted-foreground text-sm">{text}</p>}
        </div>
    );
}
