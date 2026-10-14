"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";

export async function createAnnouncement(formData:FormData){
 const {supabase,user}=await requireAdmin();
 const title=String(formData.get("title")??"").trim();
 const body=String(formData.get("body")??"").trim();
 const kind=String(formData.get("kind")??"info");
 if(title.length<1||title.length>120||body.length<1||body.length>5000||!["info","success","warning","maintenance"].includes(kind)) redirect("/announcements?error=invalid");
 const {data,error}=await supabase.from("app_announcements").insert({title,body,kind,is_active:formData.get("is_active")==="on",created_by:user.id}).select("id").single();
 if(error) redirect("/announcements?error=save");
 await supabase.from("admin_audit_log").insert({actor_id:user.id,action:"announcement.create",target_type:"announcement",target_id:data.id,details:{title,kind}});
 revalidatePath("/announcements"); revalidatePath("/");
 redirect("/announcements?created=1");
}
export async function toggleAnnouncement(formData:FormData){
 const {supabase,user}=await requireAdmin();
 const id=String(formData.get("id")??""); const next=formData.get("active")==="true";
 if(!/^[0-9a-f-]{36}$/i.test(id)) redirect("/announcements?error=invalid");
 const {error}=await supabase.from("app_announcements").update({is_active:next}).eq("id",id);
 if(error) redirect("/announcements?error=save");
 await supabase.from("admin_audit_log").insert({actor_id:user.id,action:next?"announcement.activate":"announcement.deactivate",target_type:"announcement",target_id:id});
 revalidatePath("/announcements"); revalidatePath("/");
 redirect("/announcements?updated=1");
}