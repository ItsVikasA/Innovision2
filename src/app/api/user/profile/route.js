import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// Force Node.js runtime (Firebase doesn't work in Edge Runtime)
export const runtime = 'nodejs'

export async function GET(req) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRef = doc(db, "users", session.user.email);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userSnap.data() });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, location } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Name must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (bio && bio.length > 200) {
      return NextResponse.json(
        { error: "Bio must be 200 characters or less" },
        { status: 400 }
      );
    }

    if (location && location.length > 50) {
      return NextResponse.json(
        { error: "Location must be 50 characters or less" },
        { status: 400 }
      );
    }

    const userRef = doc(db, "users", session.user.email);
    
    // Update the user document
    await updateDoc(userRef, {
      name: name.trim(),
      bio: bio?.trim() || "",
      location: location?.trim() || "",
      updatedAt: new Date().toISOString(),
    });

    // Fetch and return updated user data
    const updatedUserSnap = await getDoc(userRef);

    return NextResponse.json({
      success: true,
      user: updatedUserSnap.data(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
