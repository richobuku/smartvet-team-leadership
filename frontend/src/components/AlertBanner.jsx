const VARIANTS = {
  red: "bg-statusRed/10 border-statusRed text-statusRed",
  yellow: "bg-statusYellow/10 border-statusYellow text-yellow-800",
  green: "bg-statusGreen/10 border-statusGreen text-statusGreen",
};

export default function AlertBanner({ variant = "yellow", icon, children }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border-l-4 px-4 py-3 ${VARIANTS[variant]}`}>
      <span className="text-lg leading-none">{icon || (variant === "red" ? "🔴" : variant === "yellow" ? "🟡" : "🟢")}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}
