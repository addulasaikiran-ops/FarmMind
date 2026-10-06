import {NextResponse} from "next/server";import{db}from "@/lib/db";
export async function GET(){try{await db();return NextResponse.json({status:"ok",database:"postgresql"});}catch{return NextResponse.json({status:"degraded",database:"unavailable"},{status:503});}}
