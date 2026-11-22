import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        await dbConnect();

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
          throw new Error("No account found with this email");
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isMatch) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          regNo: user.regNo || null,
          staffId: user.staffId || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.regNo = user.regNo || null;
        token.staffId = user.staffId || null;
      }
      if (trigger === "update" && updateData) {
        if (updateData.name) token.name = updateData.name;
        if (updateData.regNo) token.regNo = updateData.regNo;
        if (updateData.staffId) token.staffId = updateData.staffId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.regNo = token.regNo || null;
        session.user.staffId = token.staffId || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};


