import { useQuery } from "@tanstack/react-query";
import { docPeople, listDocuments, type DocPerson } from "./documents";

// People on each shared document (owner + collaborators), keyed by document id.
export function useCollabMap() {
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: () => listDocuments(false) });
  const ids = docs.filter((d) => d.kind === "page").map((d) => d.id);
  const { data = [] } = useQuery({
    queryKey: ["docPeople", ids.join(",")],
    queryFn: () => docPeople(ids),
    enabled: ids.length > 0,
    staleTime: 30_000,
  });
  const map = new Map<string, DocPerson[]>();
  for (const p of data) map.set(p.document_id, [...(map.get(p.document_id) ?? []), p]);
  return map;
}
