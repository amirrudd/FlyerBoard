import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { AdDetail } from "../AdDetail";
import { PostAd } from "../PostAd";
import { UserDashboard } from "../UserDashboard";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { AdsGrid } from "./AdsGrid";
import { AuthModal } from "./AuthModal";
import { LoadingScreen } from "./LoadingScreen";
import { useState, useEffect } from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import Cookies from "js-cookie";

export function DivarApp() {
  // Initialize sidebar state based on screen size
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768; // Collapsed on mobile, expanded on desktop
    }
    return false; // Default to expanded
  });
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(() => {
    // Get location from cookies, default to Melbourne if not found or first visit
    const savedLocation = Cookies.get("selectedLocation");
    return savedLocation !== undefined ? savedLocation : "Melbourne, CBD";
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState<Id<"ads"> | null>(null);
  const [currentView, setCurrentView] = useState<"marketplace" | "post" | "dashboard">("marketplace");
  const [editingAd, setEditingAd] = useState<any>(null);

  const user = useQuery(api.auth.loggedInUser);
  const categories = useQuery(api.categories.getCategories);
  const ads = useQuery(api.ads.getAds, {
    categoryId: selectedCategory ?? undefined,
    search: searchQuery || undefined,
    location: selectedLocation && selectedLocation !== "" ? selectedLocation : undefined,
  });

  const clearAndCreateSampleData = useMutation(api.sampleData.clearAndCreateSampleData);
  const updateCategories = useMutation(api.categories.updateCategories);

  useEffect(() => {
    if (categories !== undefined) {
      if (categories.length === 0) {
        clearAndCreateSampleData().then(() => {
          toast.success("Sample data created");
          setIsInitializing(false);
        }).catch((error) => {
          console.error("Error creating sample data:", error);
          setIsInitializing(false);
        });
      } else {
        setIsInitializing(false);
      }
    }
  }, [categories, clearAndCreateSampleData]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true); // Always collapsed on mobile
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close auth modal when user logs in
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
      toast.success("Successfully signed in");
    }
  }, [user, showAuthModal]);

  // Redirect to marketplace when user signs out
  useEffect(() => {
    if (user === null && (currentView === "dashboard" || currentView === "post")) {
      setCurrentView("marketplace");
      setSelectedAdId(null);
      setEditingAd(null);
    }
  }, [user, currentView]);

  // Handle location change and save to cookies
  const handleLocationChange = useCallback((location: string) => {
    setSelectedLocation(location);
    // Always save the location to cookies, even if it's empty (All Locations)
    Cookies.set("selectedLocation", location, { expires: 365 }); // Save for 1 year
  }, []);

  const handleUpdateCategories = useCallback(async () => {
    try {
      const result = await updateCategories();
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to update categories");
      console.error(error);
    }
  }, [updateCategories]);

  const handleSetSelectedCategory = useCallback((categoryId: Id<"categories"> | null) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleSetSelectedAdId = useCallback((adId: Id<"ads">) => {
    setSelectedAdId(adId);
  }, []);

  const locations = [
    "Sydney, CBD",
    "Sydney, Northern Beaches",
    "Melbourne, CBD", 
    "Melbourne, South Yarra",
    "Brisbane, South Bank",
    "Brisbane, Fortitude Valley",
    "Perth, Fremantle",
    "Perth, Subiaco",
    "Adelaide, CBD",
    "Gold Coast, Surfers Paradise",
    "Canberra, City Centre",
  ];

  // Show ad detail if an ad is selected
  if (selectedAdId) {
    return (
      <AdDetail 
        adId={selectedAdId} 
        onBack={() => setSelectedAdId(null)}
        onShowAuth={() => setShowAuthModal(true)}
      />
    );
  }

  // Show post ad form
  if (currentView === "post") {
    return (
      <PostAd 
        onBack={() => {
          setCurrentView("marketplace");
          setEditingAd(null);
        }}
        editingAd={editingAd}
      />
    );
  }

  // Show user dashboard
  if (currentView === "dashboard") {
    return (
      <UserDashboard 
        onBack={() => setCurrentView("marketplace")}
        onPostAd={() => {
          setEditingAd(null);
          setCurrentView("post");
        }}
        onEditAd={(ad) => {
          setEditingAd(ad);
          setCurrentView("post");
        }}
      />
    );
  }
  
  // Show loading screen while initializing
  if (isInitializing || categories === undefined || ads === undefined) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Temporary admin button for updating categories */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleUpdateCategories}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Update Categories
        </button>
      </div>
      
      <Header
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        setCurrentView={setCurrentView}
        setShowAuthModal={setShowAuthModal}
        selectedLocation={selectedLocation}
        setSelectedLocation={handleLocationChange}
        locations={locations}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`flex gap-6 ${sidebarCollapsed ? 'md:gap-6' : 'gap-6'}`}>
          {/* Mobile sidebar overlay */}
          {!sidebarCollapsed && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setSidebarCollapsed(true)}
            />
          )}
          
          {/* Sidebar */}
          <div className={`${
            sidebarCollapsed 
              ? 'hidden md:block' 
              : 'fixed left-0 top-0 h-full w-80 z-50 md:relative md:w-80 md:z-auto bg-white md:bg-transparent p-4 md:p-0 pt-20 md:pt-0'
          }`}>
            <Sidebar
              sidebarCollapsed={sidebarCollapsed}
              categories={categories || []}
              selectedCategory={selectedCategory}
              setSelectedCategory={handleSetSelectedCategory}
              setSidebarCollapsed={setSidebarCollapsed}
            />
          </div>

          <AdsGrid
            ads={ads || []}
            categories={categories || []}
            selectedCategory={selectedCategory}
            sidebarCollapsed={sidebarCollapsed}
            setSelectedAdId={handleSetSelectedAdId}
          />
        </div>
      </div>

      <AuthModal
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
      />
    </div>
  );
}
