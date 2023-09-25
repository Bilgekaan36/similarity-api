import { withAuth } from "next-auth/middleware";

export default withAuth(async function middleware(req, res) {
  const pathname = req.nextUrl.pathname; //relative path

  // Manage rate limiting
});
