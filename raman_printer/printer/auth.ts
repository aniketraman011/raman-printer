import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({
          username: credentials.username.toString().toLowerCase(),
          isDeleted: false,
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password.toString(),
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.fullName,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.isVerified = user.isVerified;
        token.lastRefresh = Date.now();
      }
      
      // Auto-refresh user data from database every 30 seconds
      // So users don't need to logout/login to see updated verification status
      if (token.id) {
        const now = Date.now();
        const lastRefresh = (token.lastRefresh as number) || 0;
        if (trigger === 'update' || !lastRefresh || now - lastRefresh > 30000) {
          try {
            await connectDB();
            const dbUser = await User.findById(token.id);
            if (dbUser) {
              token.isVerified = dbUser.isVerified;
              token.role = dbUser.role;
              token.name = dbUser.fullName;
            }
            token.lastRefresh = now;
          } catch (error) {
            console.error('JWT refresh error:', error);
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      },
    },
  },
  trustHost: true,
});
