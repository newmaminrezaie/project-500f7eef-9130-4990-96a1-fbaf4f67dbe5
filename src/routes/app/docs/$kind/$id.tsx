import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import {
  DOC_KINDS,
  KIND_LABEL,
  getDocument,
  deleteDocument,
  type DocKind,
} from "@/lib/documents.functions";
import { formatToman, formatDate, toFa } from "@/lib/format";

export const Route = createFileRoute("/app/docs/$kind/$id")({
  head: () => ({ meta: [{ title: "سند — حسابداری زعفران رضایی" }] }),
  component: DocDetail,
});

function assertKind(kind: string): DocKind {
  if ((DOC_KINDS as readonly string[]).includes(kind)) return kind as DocKind;
  return "sale";
}

function Body({ id, kind }: { id: number; kind: DocKind }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteDocument);
  const navigate = useNavigate();
  const { data } = useSuspenseQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument({ data: { id } }),
  });
  if (!data) return <div className="text-muted-foreground">سند یافت نشد.</div>;
  const { doc, items } = data;
  const total = Number(doc.total_toman);
  const paid = Number(doc.paid_toman);
  const remaining = Math.max(0, total - paid);

  async function onDelete() {
    if (!confirm("حذف این سند؟")) return;
    await del({ data: { id } });
    await qc.invalidateQueries({ queryKey: ["documents"] });
    await qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    await qc.invalidateQueries({ queryKey: ["customerBalances"] });
    await navigate({ to: "/app/docs/$kind", params: { kind } });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatDate(doc.doc_date)}</span>
          <span className="num">#{toFa(doc.id)}</span>
        </div>
        {doc.customer_name && (
          <div className="mt-2 text-lg font-black">{doc.customer_name}</div>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-secondary p-2">
            <div className="text-xs text-muted-foreground">جمع</div>
            <div className="font-black num">{formatToman(total || paid)}</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-800">
            <div className="text-xs">پرداختی</div>
            <div className="font-black num">{formatToman(paid)}</div>
          </div>
          <div className="rounded-xl bg-rose-50 p-2 text-rose-800">
            <div className="text-xs">مانده</div>
            <div className="font-black num">{formatToman(remaining)}</div>
          </div>
        </div>
        {doc.notes && (
          <div className="mt-3 rounded-xl bg-muted p-3 text-sm">{doc.notes}</div>
        )}
      </div>

      {items.length > 0 && (
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <h2 className="mb-2 text-sm font-black text-muted-foreground">اقلام</h2>
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="truncate font-bold">{it.description}</div>
                  <div className="text-xs text-muted-foreground num">
                    {toFa(it.quantity)} × {formatToman(it.unit_price_toman)}
                  </div>
                </div>
                <div className="font-black num">
                  {formatToman(Number(it.quantity) * Number(it.unit_price_toman))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onDelete}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-bold text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        حذف سند
      </button>
    </div>
  );
}

function DocDetail() {
  const { kind: raw, id } = useParams({ from: "/app/docs/$kind/$id" });
  const kind = assertKind(raw);
  const numId = Number(id);
  return (
    <div className="space-y-3">
      <Link
        to="/app/docs/$kind"
        params={{ kind }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronRight className="h-4 w-4" />
        {KIND_LABEL[kind]}
      </Link>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-secondary" />}>
        <Body id={numId} kind={kind} />
      </Suspense>
    </div>
  );
}
