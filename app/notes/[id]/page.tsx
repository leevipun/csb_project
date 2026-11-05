import NoteEditor from "../../components/note-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <NoteEditor id={(await params).id} />;
}
