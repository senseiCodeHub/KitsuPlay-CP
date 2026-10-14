"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function signIn(formData:FormData){
 const email=String(formData.get("email")??"").trim();const password=String(formData.get("password")??"");
 if(!email||!password)redirect("/login?error=missing");
 const supabase=await createClient();const {error}=await supabase.auth.signInWithPassword({email,password});
 if(error)redirect("/login?error=credentials");
 const {data:{user}}=await supabase.auth.getUser();
 if(!user){await supabase.auth.signOut();redirect("/login?error=credentials");}
 const {data:admin}=await supabase.from("admin_users").select("is_active,role").eq("user_id",user.id).maybeSingle();
 if(!admin?.is_active||!["owner","admin","support"].includes(admin.role)){await supabase.auth.signOut();redirect("/login?error=notadmin");}
 redirect("/");
}