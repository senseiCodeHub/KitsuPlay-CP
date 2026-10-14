import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function requireAdmin(){
 const supabase=await createClient(); const {data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user) redirect("/login");
 const {data:profile,error}=await supabase.from("admin_users").select("user_id, role, is_active").eq("user_id",user.id).maybeSingle();
 if(error||!profile||!profile.is_active||!["owner","admin","support"].includes(profile.role)) redirect("/unauthorized");
 return {supabase,user,admin:profile};
}