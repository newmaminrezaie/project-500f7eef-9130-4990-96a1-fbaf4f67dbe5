import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Plus, ChevronLeft } from "lucide-react";
import { DOC_KINDS, KIND_LABEL, listDocuments, type DocKind } from "@/lib/documents.functions";
import { formatToman, formatDate, toFa } from "@/lib/format";

export const Route = createFileRoute("/app/docs/$kind/")({
  head: ({ params }) => ({
    meta: [{ title: `${KIND_LABEL[params.kind as DocKind] ?? "اسناد"} — حسابداری زعفران رضایی` }],
  }),
  component: DocsListPage,
});

function assertKind(kind: string): DocKind {
  if ((DOC_KINDS as readonly string[]).includes(kind)) return kind as DocKind;
  return "sale";
}

function List({ kind }: { kind: DocKind }) {
  const { data } = useSuspenseQuery({
    queryKey: ["documents", kind],
    queryFn: () => listDocuments({ data: { kind } }),
  });
  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-secondary/50 p-8 text-center text-sm text-muted-foreground">
        هنوز سندی ثبت نشده است.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.id}>
          <Link
            to="/app/docs/$kind/$id"
            params={{ kind, id: String(d.id) }}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card active:bg-accent"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary num">
              {toFa(d.id)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold text-foreground">
                {d.customer_name || "—"}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {formatDate(d.doc_date)}
              </div>
            </div>
            <div className="text-left">
              <div className="text-sm font-black num text-foreground">
                {formatToman(Number(d.total_toman) || Number(d.paid_toman))}
              </div>
              {Number(d.total_toman) > 0 && Number(d.paid_toman) < Number(d.total_toman) && (
                <div className="text-[11px] font-bold text-rose-700 num">
                  مانده {formatToman(Number(d.total_toman) - Number(d.paid_toman))}
                </div>
              )}
            </div>
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DocsListPage() {
  const { kind: raw } = useParams({ from: "/app/docs/$kind/" });
  const kind = assertKind(raw);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-foreground">{KIND_LABEL[kind]}</h1>
        <Link
          to="/app/docs/$kind/new"
          params={{ kind }}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-soft"
        >
          <Plus className="h-5 w-5" />
          جدید
        </Link>
      </div>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-secondary" />}>
        <List kind={kind} />
      </Suspense>
    </div>
  );
}
