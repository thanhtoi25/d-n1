import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma=new PrismaClient();
async function main(){
  const email=process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password=process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if(!email||!password||password.length<12){console.log("Bỏ qua tạo quản trị viên: cần BOOTSTRAP_ADMIN_EMAIL và mật khẩu tối thiểu 12 ký tự.");return;}
  await prisma.user.upsert({where:{email},update:{},create:{email,displayName:"Quản trị viên",passwordHash:await hash(password,12),role:"ADMIN",status:"ACTIVE"}});
  console.log(`Đã bảo đảm tài khoản quản trị: ${email}`);
}
main().finally(()=>prisma.$disconnect());
