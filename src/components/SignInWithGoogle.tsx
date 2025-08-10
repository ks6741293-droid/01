import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, db } from "../firebase";
import { toast } from "react-toastify";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { Chrome } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function SignInWithGoogle() {
  const navigate = useNavigate();

  // Handle redirect result when component mounts
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          
          // Try to save user data to Firestore, but don't fail if permissions are restricted
          try {
            const userDocRef = doc(db, "Users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
              // Create user document with Google profile data
              await setDoc(userDocRef, {
                email: user.email,
                firstName: user.displayName?.split(' ')[0] || '',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                photo: user.photoURL || '',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          } catch (firestoreError: any) {
            console.warn("Could not save user data to Firestore:", firestoreError.message);
            // Continue with success message even if Firestore save fails
          }
          
          toast.success("Successfully signed in with Google!", {
            position: "top-center",
          });
          
          // Navigate to home page
          navigate("/");
        }
      } catch (error: any) {
        console.error("Google sign-in redirect error:", error);
        if (error.code !== 'auth/cancelled-popup-request') {
          toast.error(error.message || "Google sign-in failed. Please try again.", {
            position: "bottom-center",
          });
        }
      }
    };

    handleRedirectResult();
  }, [navigate]);

  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    
    // Add additional scopes if needed
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
      await signInWithRedirect(auth, provider);
      // Note: The redirect will happen immediately, so no further code will execute here
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      
      // Handle specific error cases
      if (error.code === 'auth/cancelled-popup-request') {
        // User cancelled - don't show error
        return;
      } else {
        toast.error(error.message || "Google sign-in failed. Please try again.", {
          position: "bottom-center",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <button
        onClick={googleLogin}
        type="button"
        className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-300 transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
      >
        <Chrome className="w-5 h-5 text-red-500" />
        <span>Continue with Google</span>
      </button>
    </div>
  );
}

export default SignInWithGoogle;