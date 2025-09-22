import { cn } from "@/lib/utils";

// Empty component
export function Empty({ message = "暂无数据" }: { message?: string }) {
  return (
    <div className={cn("flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500")}>
      <i className="fa-solid fa-inbox mb-4 text-4xl text-slate-300"></i>
      <p>{message}</p>
    </div>
  );
}