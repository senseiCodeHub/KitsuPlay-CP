"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
export async function setUserBan(formData:FormData){
 const {supabase,user}=await requireAdmin();const userId=String(formData.get("user_id")??"");const action=String(formData.get("action")??"");
 if(!/^[0-9a-f-]{36}$/i.test(userId)||!["ban","unban"].includes(action))redirect("/users?error=invalid");
 if(userId===user.id)redirect("/users?error=self");
 let adminClient;
 try{adminClient=createAdminClient();}catch{redirect("/users?error=config");}
 const {error}=await adminClient.auth.admin.updateUserById(userId,{ban_duration:action==="ban"?"876000h":"none"});
 if(error)redirect("/users?error=save");
 await supabase.from("admin_audit_log").insert({actor_id:user.id,action:action==="ban"?"user.ban":"user.unban",target_type:"auth_user",target_id:userId});
 revalidatePath("/users");revalidatePath("/");redirect("/users?updated=1");
}