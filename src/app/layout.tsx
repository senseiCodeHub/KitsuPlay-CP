import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"KitsuPlay Control Panel",description:"Secure administration console for KitsuPlay."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}