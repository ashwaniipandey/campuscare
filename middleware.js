import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role;

    // Protect /ambulance routes: only ambulance role
    if (path.startsWith("/ambulance") && role !== "ambulance") {
      if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      if (role === "staff") return NextResponse.redirect(new URL("/staff/dashboard", req.url));
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }

    // Role ambulance can only access /ambulance/*
    if (role === "ambulance" && !path.startsWith("/ambulance")) {
      return NextResponse.redirect(new URL("/ambulance/dashboard", req.url));
    }

    // Protect /admin routes: only admin
    if (path.startsWith("/admin") && role !== "admin") {
      if (role === "staff") return NextResponse.redirect(new URL("/staff/dashboard", req.url));
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }

    // Protect /staff routes: staff and admin
    if (path.startsWith("/staff") && role !== "staff" && role !== "admin") {
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }

    // Protect /student routes: student and admin
    if (path.startsWith("/student") && role !== "student" && role !== "admin") {
      return NextResponse.redirect(new URL("/staff/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/student/:path*",
    "/staff/:path*",
    "/admin/:path*",
    "/ambulance/:path*",
  ],
};
