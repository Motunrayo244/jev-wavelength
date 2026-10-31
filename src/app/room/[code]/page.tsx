import { Suspense } from "react";
import { RoomGate } from "@/components/RoomGate";
import { WaveField } from "@/components/WaveField";

async function RoomContent({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <RoomGate code={code.toUpperCase()} />;
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <main className="room-page">
      <WaveField />
      <Suspense
        fallback={<p className="waiting-note center-note">Tuning into room…</p>}
      >
        <RoomContent params={params} />
      </Suspense>
    </main>
  );
}
