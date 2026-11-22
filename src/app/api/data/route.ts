import { authenticated, listReports, readReport } from "@/lib/report-archive";

export async function GET(request: Request) {
  if (!await authenticated(request)) return Response.json({error:"Silakan masuk kembali."},{status:401});
  try {
    const reports = await listReports();
    const id = new URL(request.url).searchParams.get("id") ?? reports[0]?.id;
    if (id && !reports.some(report => report.id === id)) return Response.json({error:"Laporan tidak ditemukan."},{status:404});
    return Response.json({success:true, reports, id, data:id ? await readReport(id) : null});
  } catch {
    return Response.json({error:"Riwayat laporan tidak dapat dibaca dari Firestore."},{status:503});
  }
}
