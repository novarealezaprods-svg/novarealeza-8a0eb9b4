import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Ctx = {
  editing: boolean;
  setEditing: (v: boolean) => void;
  get: (key: string, fallback: string) => string;
  set: (key: string, value: string) => void;
  reset: () => void;
};

const EditableCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "nr_editable_content";

export function EditableProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setData(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch {}
  }, []);

  const persist = (next: Record<string, string>) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const value: Ctx = {
    editing,
    setEditing,
    get: (key, fallback) => (key in data ? data[key] : fallback),
    set: (key, val) => persist({ ...data, [key]: val }),
    reset: () => {
      persist({});
    },
  };

  return <EditableCtx.Provider value={value}>{children}</EditableCtx.Provider>;
}

export function useEditable() {
  const ctx = useContext(EditableCtx);
  if (!ctx) throw new Error("useEditable must be used inside EditableProvider");
  return ctx;
}

type EditableTextProps = {
  id: string;
  children: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  multiline?: boolean;
};

export function EditableText({ id, children, as: Tag = "span", className, multiline }: EditableTextProps) {
  const { editing, get, set } = useEditable();
  const value = get(id, children);

  if (!editing) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      className={(className || "") + " outline outline-2 outline-dashed outline-primary/60 rounded px-1 focus:outline-primary focus:bg-primary/5"}
      contentEditable
      suppressContentEditableWarning
      data-edit-id={id}
      onBlur={(e) => {
        const text = (e.target as HTMLElement).innerText;
        if (text !== value) set(id, multiline ? text : text.replace(/\n/g, " "));
      }}
    >
      {value}
    </Tag>
  );
}

export function EditModeToggle() {
  const { editing, setEditing, reset } = useEditable();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      {editing && (
        <button
          onClick={() => {
            if (confirm("Restaurar todos os textos originais?")) reset();
          }}
          className="rounded-full bg-card border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive shadow-lg"
        >
          Restaurar
        </button>
      )}
      <button
        onClick={() => setEditing(!editing)}
        className={
          "rounded-full px-5 py-2 text-xs uppercase tracking-widest font-bold shadow-lg transition-all " +
          (editing
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border text-foreground hover:border-primary")
        }
      >
        {editing ? "✓ Salvar e sair" : "✎ Editar textos"}
      </button>
    </div>
  );
}