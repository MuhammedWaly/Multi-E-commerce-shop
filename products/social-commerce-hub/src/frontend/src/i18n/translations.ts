export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface Translations {
  common: {
    language: string;
    english: string;
    arabic: string;
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    search: string;
    clear: string;
    success: string;
    error: string;
    egp: string;
    verified: string;
    unverified: string;
    items: string;
    status: string;
    viewAll: string;
    reset: string;
    actions: string;
    or: string;
    active: string;
    suspended: string;
  };
  header: {
    announcement: string;
    announcementSub: string;
    brandTagline: string;
    marketplace: string;
    sellerPortal: string;
    merchantCenter: string;
    shopperFeed: string;
    myStoreDashboard: string;
    adminCenter: string;
    searchPlaceholder: string;
    searchMobilePlaceholder: string;
    searchShortcut: string;
    myOrders: string;
    openStore: string;
    signIn: string;
    cart: string;
    logout: string;
    accountSettingsTooltip: string;
    matchingStores: string;
    matchingProducts: string;
    noExactMatch: string;
    showingClosest: string;
    noResults: string;
    trySearching: string;
    viewAllSearchDropdown: string;
    enterKeyHint: string;
    visitStore: string;
  };
  categories: {
    all: string;
    fashion: string;
    leather: string;
    home: string;
    accessories: string;
  };
  hero: {
    badge: string;
    titlePart1: string;
    titleHighlight: string;
    description: string;
    exploreBtn: string;
    seeAllBtn: string;
    storesBtn: string;
    makersMetric: string;
    makersLabel: string;
    ratingMetric: string;
    ratingLabel: string;
    deliveryMetric: string;
    deliveryLabel: string;
    fashionPill: string;
    leatherPill: string;
  };
  featuredStores: {
    badge: string;
    title: string;
    description: string;
    exploreStore: string;
    productsCount: string;
  };
  catalog: {
    badge: string;
    title: string;
    itemCountText: string;
    seeAllPaginate: string;
    showingText: string;
    sortBy: string;
    sortFeatured: string;
    sortPriceLow: string;
    sortPriceHigh: string;
    sortRating: string;
    sortNewest: string;
    noItemsTitle: string;
    noItemsDesc: string;
    resetFilters: string;
  };
  filters: {
    title: string;
    reset: string;
    category: string;
    priceRange: string;
    allPrices: string;
    under500: string;
    from500to1000: string;
    over1000: string;
    customRange: string;
    minPrice: string;
    maxPrice: string;
    mediaFormat: string;
    mediaAll: string;
    mediaVideo: string;
    mediaImage: string;
    filterByBoutique: string;
    allBoutiques: string;
    inStockOnly: string;
    minRating: string;
    allRatings: string;
  };
  product: {
    videoBadge: string;
    featuredBadge: string;
    originalPrice: string;
    ratingLabel: string;
    inStock: string;
    soldOut: string;
    quickBuy: string;
    addToCart: string;
    visitBoutique: string;
  };
  cart: {
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
    startShopping: string;
    orderSummary: string;
    subtotal: string;
    shipping: string;
    freeShipping: string;
    platformFee: string;
    total: string;
    checkoutPaypal: string;
    paypalProcessing: string;
    paypalSuccess: string;
    secureNotice: string;
    clearCart: string;
  };
  checkout: {
    selectPaymentMethod: string;
    paymentMethodDesc: string;
    codTitle: string;
    codDesc: string;
    fawryTitle: string;
    fawryDesc: string;
    instaPayTitle: string;
    instaPayDesc: string;
    paypalTitle: string;
    paypalDesc: string;
    fawryRefCode: string;
    fawryExpiryNotice: string;
    fawryInstructionsTitle: string;
    fawryStep1: string;
    fawryStep2: string;
    fawryStep3: string;
    fawryCopyCode: string;
    fawryCodeCopied: string;
    fawrySimulatePayment: string;
    fawrySimulating: string;
    fawrySettledSuccess: string;
    walletProvider: string;
    senderPhoneLabel: string;
    senderPhonePlaceholder: string;
    transferRefLabel: string;
    transferRefPlaceholder: string;
    recipientAccountNotice: string;
    walletValidationPhone: string;
    walletValidationRef: string;
    codInstruction: string;
    codZeroUpfrontBadge: string;
    orderIdLabel: string;
    orderDateLabel: string;
    shippingAddressPlaceholder: string;
    statusPending: string;
    statusAwaitingPayment: string;
    statusPaid: string;
    statusFulfilled: string;
    settlementStatusLabel: string;
    settled: string;
    pendingCollection: string;
    pendingVerification: string;
    awaitingKiosk: string;
    channelCol: string;
    settlementCol: string;
    placeOrderCod: string;
    generateFawryCode: string;
    submitInstaPay: string;
    checkoutPaypal: string;
    receiptTitleCod: string;
    receiptTitleFawry: string;
    receiptTitleInstaPay: string;
    receiptTitlePaypal: string;
    openPaypalCheckout: string;
    deliveryDetails: string;
    payableOnDelivery: string;
    fawryServiceCodePill: string;
    instaPayPill: string;
    paypalPill: string;
  };
  searchPage: {
    homeBreadcrumb: string;
    searchBreadcrumb: string;
    backToHome: string;
    resetAllButton: string;
    bannerBadge: string;
    bannerTitle: string;
    inputPlaceholder: string;
    matchingBoutiquesTitle: string;
    clickToVisit: string;
    filterResults: string;
    showingMatching: string;
    forQuery: string;
    itemsPerPage: string;
    noProductsTitle: string;
    noProductsDesc: string;
    showAllButton: string;
    pageOf: string;
    previous: string;
    next: string;
  };
  storefront: {
    backToMarketplace: string;
    verifiedBoutique: string;
    verifiedBadge: string;
    boutiqueRating: string;
    reviewsCount: string;
    independentMaker: string;
    allProductsTab: string;
    reelsVideoTab: string;
    storeProductsTitle: string;
    noStoreProducts: string;
  };
  merchantDashboard: {
    title: string;
    viewStorefront: string;
    grossSales: string;
    grossSalesDesc: string;
    netPayout: string;
    netPayoutDesc: string;
    netEarnings: string;
    platformFee: string;
    platformFeeDesc: string;
    completedOrders: string;
    completedOrdersDesc: string;
    tabsOverview: string;
    tabsAddProduct: string;
    tabsProducts: string;
    tabsOrders: string;
    editProductTitle: string;
    addProductTitle: string;
    editProductDesc: string;
    addProductDesc: string;
    cancelEdit: string;
    fieldTitle: string;
    fieldTitlePlaceholder: string;
    fieldPrice: string;
    fieldStock: string;
    fieldCategory: string;
    fieldMediaUpload: string;
    dragDropText: string;
    clickToUpload: string;
    uploadSizeHint: string;
    uploadingMedia: string;
    orMediaUrl: string;
    urlPlaceholder: string;
    videoCheckbox: string;
    saveChangesBtn: string;
    publishProductBtn: string;
    currentProductsTitle: string;
    currentProductsDesc: string;
    noProductsYet: string;
    editTooltip: string;
    deleteTooltip: string;
    deleteConfirm: string;
    deleteProductConfirm: string;
    deleteProductFailed: string;
    uploadMediaFailed: string;
    storePreviewModeBanner: string;
    signInAsMerchantAction: string;
    productPublishedSuccess: string;
    productUpdatedSuccess: string;
    uploadPill: string;
    linkUrlPill: string;
    ordersTableTitle: string;
    orderIdCol: string;
    customerCol: string;
    itemsCol: string;
    totalCol: string;
    dateCol: string;
    statusCol: string;
    channelCol: string;
    settlementCol: string;
    markDispatched: string;
    completed: string;
    ledgerTransactionsTitle: string;
    ledgerTransactionsDesc: string;
    disbursementCibDesc: string;
    noOrdersYet: string;
  };
  adminPortal: {
    title: string;
    subtitle: string;
    liveGovernanceBadge: string;
    gmvMetric: string;
    gmvDesc: string;
    feeMetric: string;
    feeDesc: string;
    platformTakeRate: string;
    activeStoresMetric: string;
    activeStoresDesc: string;
    totalListingsMetric: string;
    totalListingsDesc: string;
    tabsStores: string;
    tabsListings: string;
    tabsAudit: string;
    userDirectoryTab: string;
    refreshMetrics: string;
    rolePrefix: string;
    systemHealthHeading: string;
    registeredUsersHeading: string;
    rbacSubtitle: string;
    roleCol: string;
    associatedStoreCol: string;
    storesHeading: string;
    storesDesc: string;
    deleteStoreBtn: string;
    deleteStoreConfirm: string;
    listingsHeading: string;
    listingsDesc: string;
    deleteProductBtn: string;
    deleteProductConfirm: string;
    auditHeading: string;
    auditDesc: string;
    channelCol: string;
    settlementCol: string;
    allChannelsFilter: string;
    activeStatus: string;
    suspendedStatus: string;
  };
  authModal: {
    welcomeBack: string;
    joinTitle: string;
    forgotTitle: string;
    resetTitle: string;
    signInSubtitle: string;
    signUpSubtitle: string;
    forgotSubtitle: string;
    resetSubtitle: string;
    tabSignIn: string;
    tabCreateAccount: string;
    roleBuyer: string;
    roleBuyerDesc: string;
    roleSeller: string;
    roleSellerDesc: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    storeNameLabel: string;
    storeNamePlaceholder: string;
    storeUrlLabel: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    resetTokenLabel: string;
    resetTokenPlaceholder: string;
    forgotPasswordLink: string;
    signInBtn: string;
    createAccountBtn: string;
    sendResetBtn: string;
    setNewPasswordBtn: string;
    backToSignIn: string;
    haveTokenLink: string;
    quickDemoLogins: string;
    demoShopper: string;
    demoSari: string;
    demoCairo: string;
    demoAdmin: string;
  };
  accountSettings: {
    title: string;
    closeTitle: string;
    tabProfile: string;
    tabPassword: string;
    tabEmail: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    phoneLabel: string;
    phonePlaceholder: string;
    avatarLabel: string;
    avatarPlaceholder: string;
    saveProfileBtn: string;
    savingProfile: string;
    currentPasswordLabel: string;
    currentPasswordPlaceholder: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmNewPasswordLabel: string;
    confirmNewPasswordPlaceholder: string;
    showPasswords: string;
    updatePasswordBtn: string;
    updatingPassword: string;
    verifiedStatus: string;
    unverifiedStatus: string;
    verifiedNotice: string;
    unverifiedNotice: string;
    tokenLabel: string;
    tokenPlaceholder: string;
    confirmTokenBtn: string;
    resendTokenBtn: string;
    allSetMessage: string;
  };
  buyerOrders: {
    title: string;
    subtitle: string;
    orderNumber: string;
    statusDelivered: string;
    statusPaid: string;
    shippingTo: string;
    orderDate: string;
    itemsHeading: string;
    leaveReviewBtn: string;
    paymentChannelLabel: string;
    refLabel: string;
    senderAccountLabel: string;
    fawryKioskRef: string;
    noOrdersTitle: string;
    noOrdersDesc: string;
    loadOrdersFailed: string;
  };
  reviews: {
    title: string;
    basedOn: string;
    verifiedPurchases: string;
    customerReviewsHeading: string;
    noReviewsYet: string;
    writeReviewHeading: string;
    yourNameLabel: string;
    yourEmailLabel: string;
    yourRatingLabel: string;
    yourCommentLabel: string;
    commentPlaceholder: string;
    submitReviewBtn: string;
    submittingReview: string;
    verifiedPurchaseBadge: string;
  };
  createMerchantModal: {
    title: string;
    subtitle: string;
    storeNameLabel: string;
    storeNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    urlPreview: string;
    openStoreBtn: string;
    openingStore: string;
    cancelBtn: string;
  };
  footer: {
    brandDesc: string;
    discoverHeading: string;
    communityHeading: string;
    sellerHeading: string;
    rightsReserved: string;
    egyptianPlatform: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      language: 'Language',
      english: 'English',
      arabic: 'العربية',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      search: 'Search',
      clear: 'Clear',
      success: 'Success',
      error: 'Error',
      egp: 'EGP',
      verified: 'Verified',
      unverified: 'Unverified',
      items: 'items',
      status: 'Status',
      viewAll: 'View All',
      reset: 'Reset',
      actions: 'Actions',
      or: 'or',
      active: 'Active',
      suspended: 'Suspended',
    },
    header: {
      announcement: 'Verified Local Independent Boutiques & Craftsmen across Egypt',
      announcementSub: 'Role-Based Access Control & JWT Multi-Tenant Shield',
      brandTagline: 'Curated Multi-Store E-Commerce',
      marketplace: 'Marketplace',
      sellerPortal: 'Seller Portal',
      merchantCenter: 'Merchant Portal',
      shopperFeed: 'Shopper Feed',
      myStoreDashboard: 'My Store Dashboard',
      adminCenter: 'Admin Center',
      searchPlaceholder: 'Search boutique apparel, handcrafted leather, ceramics, or stores...',
      searchMobilePlaceholder: 'Search products or stores...',
      searchShortcut: '⌘K',
      myOrders: 'My Orders',
      openStore: '+ Open Store',
      signIn: '👤 Sign In',
      cart: 'Cart',
      logout: 'Log Out',
      accountSettingsTooltip: 'Account Settings & Security',
      matchingStores: 'Matching Stores & Boutiques',
      matchingProducts: 'Matching Products & Discoveries',
      noExactMatch: 'No exact match for',
      showingClosest: 'Showing closest ranked results:',
      noResults: 'No exact or closest matches',
      trySearching: 'Try searching for "linen", "leather", or "sari"',
      viewAllSearchDropdown: 'View all matching results in dedicated search page',
      enterKeyHint: '↵ Enter',
      visitStore: 'Visit ↗',
    },
    categories: {
      all: '🔥 All Discoveries',
      fashion: '👗 Fashion & Apparel',
      leather: '👜 Handcrafted Leather',
      home: '🏺 Ceramics & Home',
      accessories: '✨ Accessories',
    },
    hero: {
      badge: "✨ Egypt's Premier Multi-Merchant Discovery Platform",
      titlePart1: 'Shop Directly from',
      titleHighlight: 'Independent Creators & Boutiques',
      description: 'Explore authentic linen fashion, heritage hand-stitched leather, and Tunis Village pottery. Every purchase directly empowers local Egyptian makers with seamless PayPal checkout.',
      exploreBtn: '🛍️ Explore Marketplace',
      seeAllBtn: '🔍 See All Products',
      storesBtn: '🏬 Top Stores',
      makersMetric: '100%',
      makersLabel: 'Verified Makers',
      ratingMetric: '4.9 ★',
      ratingLabel: 'Customer Rating',
      deliveryMetric: 'Fast',
      deliveryLabel: 'Express Delivery',
      fashionPill: 'Linen Fashion',
      leatherPill: 'Handmade Leather',
    },
    featuredStores: {
      badge: 'Independent Brands',
      title: 'Featured Egyptian Boutiques',
      description: 'Hand-picked independent creators celebrated for craftsmanship and authenticity.',
      exploreStore: 'Explore Store',
      productsCount: 'curated products',
    },
    catalog: {
      badge: 'Curated Catalog',
      title: 'Explore All Discoveries',
      itemCountText: 'items from Egyptian boutiques & makers',
      seeAllPaginate: 'See All & Paginate',
      showingText: 'curated discoveries',
      sortBy: 'Sort by:',
      sortFeatured: '✨ Featured & Trending',
      sortPriceLow: 'Price: Low to High',
      sortPriceHigh: 'Price: High to Low',
      sortRating: 'Highest Rated',
      sortNewest: 'Newest Additions',
      noItemsTitle: 'No items found matching your filters',
      noItemsDesc: 'Try adjusting your category, price range, or minimum rating to explore more boutique products.',
      resetFilters: 'Reset All Filters',
    },
    filters: {
      title: 'Filters',
      reset: 'Reset',
      category: 'Category',
      priceRange: 'Price Range',
      allPrices: 'All Prices',
      under500: 'Under 500 EGP',
      from500to1000: '500 - 1,000 EGP',
      over1000: 'Over 1,000 EGP',
      customRange: 'Custom Range',
      minPrice: 'Min',
      maxPrice: 'Max',
      mediaFormat: 'Media Format',
      mediaAll: 'All',
      mediaVideo: '🎬 Reels',
      mediaImage: '📷 Photos',
      filterByBoutique: 'Filter by Boutique',
      allBoutiques: '🏬 All Boutiques & Stores',
      inStockOnly: 'In Stock Only',
      minRating: 'Minimum Rating',
      allRatings: 'All',
    },
    product: {
      videoBadge: '▶ Video',
      featuredBadge: 'Featured',
      originalPrice: 'Original:',
      ratingLabel: 'Rating',
      inStock: 'In Stock',
      soldOut: 'Out of Stock',
      quickBuy: '⚡ Express Buy',
      addToCart: 'Add to Cart',
      visitBoutique: 'Visit Boutique',
    },
    cart: {
      title: 'Your Shopping Cart',
      emptyTitle: 'Your cart is empty',
      emptySubtitle: 'Explore artisan creations and support Egyptian boutiques.',
      startShopping: 'Start Exploring Discoveries',
      orderSummary: 'Order Summary',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      freeShipping: 'FREE (Nationwide)',
      platformFee: 'Platform Fee (5%)',
      total: 'Total Amount',
      checkoutPaypal: 'Pay with PayPal Sandbox',
      paypalProcessing: 'Connecting to PayPal...',
      paypalSuccess: 'Payment Approved! Order created successfully.',
      secureNotice: '🔒 Encrypted 256-bit PayPal Express Checkout',
      clearCart: 'Clear Cart',
    },
    checkout: {
      selectPaymentMethod: 'Select Payment Method',
      paymentMethodDesc: 'Choose how you would like to complete your order in Egypt.',
      codTitle: 'Cash on Delivery (COD)',
      codDesc: 'Pay in cash upon delivery with zero upfront digital payment.',
      fawryTitle: 'Fawry Pay Reference',
      fawryDesc: 'Pay via 8-digit bill reference at any Fawry retail machine or myFawry app.',
      instaPayTitle: 'InstaPay & Mobile Wallets',
      instaPayDesc: 'Instant transfer via InstaPay (IPA) or Vodafone/Orange/Etisalat/We Cash.',
      paypalTitle: 'PayPal Sandbox',
      paypalDesc: 'International credit/debit card checkout via encrypted PayPal session.',
      fawryRefCode: 'Fawry Bill Reference Code',
      fawryExpiryNotice: 'Valid for 48 hours. Service Code: 788 (SocialHub Egypt)',
      fawryInstructionsTitle: 'How to Pay with Fawry:',
      fawryStep1: 'Visit any Fawry POS store, Aman kiosk, or open the myFawry app.',
      fawryStep2: 'Select SocialHub Marketplace (Service Code: 788).',
      fawryStep3: 'Enter your 8-digit bill reference number and pay in cash.',
      fawryCopyCode: 'Copy Reference',
      fawryCodeCopied: 'Copied!',
      fawrySimulatePayment: '⚡ Simulate Fawry Kiosk Settlement',
      fawrySimulating: 'Simulating Kiosk Settlement...',
      fawrySettledSuccess: 'Fawry bill settled successfully! Order marked as Paid.',
      walletProvider: 'Wallet / Transfer Service',
      senderPhoneLabel: 'Sender Phone Number or InstaPay Address',
      senderPhonePlaceholder: 'e.g. 01012345678 or user@instapay',
      transferRefLabel: 'Transaction Reference / Sequence No.',
      transferRefPlaceholder: 'e.g. TXN-849201 or 12-digit receipt reference',
      recipientAccountNotice: 'Transfer total amount to: socialhub@instapay or Wallet 0100 123 4567',
      walletValidationPhone: 'Please enter your sender mobile number or InstaPay address.',
      walletValidationRef: 'Please enter your transfer transaction reference number.',
      codInstruction: 'Order confirmed! Please prepare the exact cash amount for the courier upon delivery.',
      codZeroUpfrontBadge: 'Zero Upfront Payment Required',
      orderIdLabel: 'Order ID',
      orderDateLabel: 'Order Placed',
      shippingAddressPlaceholder: 'Shipping Address (City, District, Street, Building)',
      statusPending: 'Pending Fulfillment',
      statusAwaitingPayment: 'Awaiting Payment',
      statusPaid: 'Paid & Processing',
      statusFulfilled: 'Fulfilled & Delivered',
      settlementStatusLabel: 'Settlement Status',
      settled: 'Settled',
      pendingCollection: 'Pending Collection on Delivery',
      pendingVerification: 'Pending Transfer Verification',
      awaitingKiosk: 'Awaiting Kiosk Payment',
      channelCol: 'Payment Channel',
      settlementCol: 'Settlement Status',
      placeOrderCod: 'Place Order (Cash on Delivery)',
      generateFawryCode: 'Generate Fawry Reference Code',
      submitInstaPay: 'Confirm InstaPay Transfer',
      checkoutPaypal: 'Pay with PayPal Sandbox',
      receiptTitleCod: '✓ Order Confirmed (Cash on Delivery)',
      receiptTitleFawry: '🧾 Awaiting Fawry Payment',
      receiptTitleInstaPay: '⚡ Transfer Recorded - In Verification',
      receiptTitlePaypal: '✓ Payment Approved via PayPal',
      openPaypalCheckout: 'Open Official PayPal Checkout ↗',
      deliveryDetails: 'Delivery Details',
      payableOnDelivery: 'Total Payable on Delivery',
      fawryServiceCodePill: 'Code: 788',
      instaPayPill: 'IPA / Wallets',
      paypalPill: 'Cards',
    },
    searchPage: {
      homeBreadcrumb: 'Home',
      searchBreadcrumb: 'Search & Catalog',
      backToHome: 'Back to Home',
      resetAllButton: '🔄 Reset All Filters & View All Products',
      bannerBadge: 'Comprehensive Marketplace Search',
      bannerTitle: 'Explore All Boutique Discoveries & Stores',
      inputPlaceholder: 'Search products, materials (linen, leather), boutiques, or categories...',
      matchingBoutiquesTitle: 'Matching Boutiques & Stores',
      clickToVisit: 'Click to visit storefront',
      filterResults: 'Filter Results',
      showingMatching: 'matching products',
      forQuery: 'for',
      itemsPerPage: 'per page',
      noProductsTitle: 'No products found matching your search',
      noProductsDesc: 'No items matched your current search filters. You can clear your search or reset all filters to view all available products.',
      showAllButton: '🔄 Show All Products & Reset Filters',
      pageOf: 'Page',
      previous: '← Previous',
      next: 'Next →',
    },
    storefront: {
      backToMarketplace: 'Back to Marketplace',
      verifiedBoutique: 'Verified Egyptian Independent Boutique',
      verifiedBadge: 'Verified Store',
      boutiqueRating: 'Customer Rating',
      reviewsCount: 'Verified Reviews',
      independentMaker: 'Independent Maker',
      allProductsTab: '🛍️ All Discoveries',
      reelsVideoTab: '🎬 Video Reels',
      storeProductsTitle: 'Boutique Catalog',
      noStoreProducts: 'No products currently published for this store.',
    },
    merchantDashboard: {
      title: 'Merchant Command Center',
      viewStorefront: 'Visit Public Storefront',
      grossSales: 'Gross Sales',
      grossSalesDesc: 'Total sales volume before platform fee deduction',
      netPayout: 'Net Earnings',
      netPayoutDesc: 'Net revenue credited directly to your store account',
      netEarnings: 'Merchant Net Amount',
      platformFee: 'Platform Commission (5%)',
      platformFeeDesc: 'Retained platform support & hosting fee',
      completedOrders: 'Fulfilled Orders',
      completedOrdersDesc: 'Successfully delivered customer purchases',
      tabsOverview: '📊 Store Overview',
      tabsAddProduct: '➕ New Product Listing',
      tabsProducts: '🛍️ Current Catalog',
      tabsOrders: '📦 Order Fulfillment',
      editProductTitle: '✏️ Edit Product Listing',
      addProductTitle: '➕ Add New Product Listing',
      editProductDesc: 'Update title, pricing, stock, or media for this listing.',
      addProductDesc: 'Publish a new handcrafted piece to your boutique storefront.',
      cancelEdit: 'Cancel Edit',
      fieldTitle: 'Product Title',
      fieldTitlePlaceholder: 'e.g. Handmade Linen Kimono',
      fieldPrice: 'Price (EGP)',
      fieldStock: 'Initial Stock Quantity',
      fieldCategory: 'Product Category',
      fieldMediaUpload: 'Upload Media (Images / Video Reels)',
      dragDropText: 'Drag & drop image or video here, or',
      clickToUpload: 'browse files',
      uploadSizeHint: 'Images up to 15MB (.jpg, .png, .webp) | Videos up to 60MB (.mp4, .mov)',
      uploadingMedia: 'Uploading file to storage...',
      orMediaUrl: 'Or enter direct media URL:',
      urlPlaceholder: 'https://images.unsplash.com/... or /uploads/...',
      videoCheckbox: 'This media is a video (Play as interactive reel)',
      saveChangesBtn: '💾 Save Product Changes',
      publishProductBtn: '🚀 Publish Product Listing',
      currentProductsTitle: 'Current Store Products',
      currentProductsDesc: 'Manage, edit details, or remove products from your storefront.',
      noProductsYet: 'No products created yet. Use the form above to add your first product!',
      editTooltip: 'Edit Product',
      deleteTooltip: 'Delete Product',
      deleteConfirm: 'Are you sure you want to delete this product? This action cannot be undone.',
      deleteProductConfirm: 'Are you sure you want to permanently delete product "{title}" from your store?',
      deleteProductFailed: 'Failed to delete product.',
      uploadMediaFailed: 'Failed to upload media file.',
      storePreviewModeBanner: 'Viewing in Store Preview mode. To publish products, dispatch customer orders, or disburse payments, sign in as a verified merchant.',
      signInAsMerchantAction: 'Sign In as Merchant →',
      productPublishedSuccess: 'Product published successfully!',
      productUpdatedSuccess: 'Product updated successfully!',
      uploadPill: '📁 Upload',
      linkUrlPill: '🔗 Link URL',
      ordersTableTitle: 'Recent Customer Orders',
      orderIdCol: 'Order ID',
      customerCol: 'Customer',
      itemsCol: 'Items',
      totalCol: 'Amount',
      dateCol: 'Date',
      statusCol: 'Status',
      channelCol: 'Payment Channel',
      settlementCol: 'Settlement Status',
      markDispatched: 'Mark Dispatched ✓',
      completed: 'Completed',
      ledgerTransactionsTitle: 'Merchant Ledger Transactions',
      ledgerTransactionsDesc: 'Audited settlement records and payout distribution history',
      disbursementCibDesc: 'Disbursement to Commercial International Bank (CIB) Egypt',
      noOrdersYet: 'No customer orders received yet for this store.',
    },
    adminPortal: {
      title: 'Platform Administration & Governance',
      subtitle: 'System-wide monitoring, financial oversight, and content moderation.',
      liveGovernanceBadge: '🛡️ Platform Admin Mode',
      gmvMetric: 'Platform GMV',
      gmvDesc: 'Gross merchandise volume transacted across all stores',
      feeMetric: 'Platform Revenue (5%)',
      feeDesc: 'Retained platform fees deposited to platform balance',
      platformTakeRate: '5% Take Rate',
      activeStoresMetric: 'Active Boutiques',
      activeStoresDesc: 'Registered independent makers & shops',
      totalListingsMetric: 'Live Listings',
      totalListingsDesc: 'Products currently discoverable in marketplace',
      tabsStores: '🏬 Stores Management',
      tabsListings: '🛍️ Catalog Moderation',
      tabsAudit: '📑 Platform Orders',
      userDirectoryTab: '👥 User Directory',
      refreshMetrics: 'Refresh Metrics',
      rolePrefix: 'Role:',
      systemHealthHeading: 'Platform Architecture & Identity Health',
      registeredUsersHeading: 'Registered User Accounts',
      rbacSubtitle: 'Role-Based Access Control (RBAC) Directory',
      roleCol: 'Role',
      associatedStoreCol: 'Associated Store',
      storesHeading: 'Registered Boutique Stores',
      storesDesc: 'Inspect, manage, or moderate independent store partners.',
      deleteStoreBtn: 'Delete Store',
      deleteStoreConfirm: 'Are you sure you want to delete this merchant and all their listings? This action cannot be undone.',
      listingsHeading: 'All Marketplace Listings',
      listingsDesc: 'Review and moderate product listings across all registered stores.',
      deleteProductBtn: 'Delete Listing',
      deleteProductConfirm: 'Are you sure you want to delete this product listing from the platform?',
      auditHeading: 'Platform Orders Ledger',
      auditDesc: 'Complete audit trail of all transactions, commissions, and merchant net payouts.',
      channelCol: 'Payment Channel',
      settlementCol: 'Settlement Status',
      allChannelsFilter: 'All Payment Channels',
      activeStatus: 'Active',
      suspendedStatus: 'Suspended',
    },
    authModal: {
      welcomeBack: 'Welcome Back',
      joinTitle: 'Join SocialHub Egypt',
      forgotTitle: 'Forgot Password?',
      resetTitle: 'Reset Your Password',
      signInSubtitle: 'Access your saved discoveries, orders, and storefront portal',
      signUpSubtitle: 'Discover artisanal fashion & leather or launch your boutique',
      forgotSubtitle: 'Enter your email to receive a password reset token or link',
      resetSubtitle: 'Enter your verification token and choose a new password',
      tabSignIn: 'Sign In',
      tabCreateAccount: 'Create Account',
      roleBuyer: '🛍️ Shop & Discover',
      roleBuyerDesc: 'Explore curated local brands',
      roleSeller: '🏬 Sell & Manage',
      roleSellerDesc: 'Open independent store',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'e.g. Layla Nour',
      storeNameLabel: 'Storefront Name',
      storeNamePlaceholder: 'e.g. Lotus Studio',
      storeUrlLabel: 'Store URL:',
      emailLabel: 'Email Address',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      currentPasswordLabel: 'Current Password',
      newPasswordLabel: 'New Password (Min 6 chars)',
      confirmPasswordLabel: 'Confirm New Password',
      resetTokenLabel: 'Reset Token / Code',
      resetTokenPlaceholder: 'Paste token from email',
      forgotPasswordLink: 'Forgot Password?',
      signInBtn: 'Sign In to Account →',
      createAccountBtn: 'Create My Account →',
      sendResetBtn: '✉️ Send Reset Token Link',
      setNewPasswordBtn: '🔒 Set New Password',
      backToSignIn: '← Back to Sign In',
      haveTokenLink: 'I have a reset token →',
      quickDemoLogins: 'Quick One-Click Demo Logins',
      demoShopper: '👤 Shopper',
      demoSari: '🏬 Sari Store',
      demoCairo: '👜 Cairo Craft',
      demoAdmin: '🛡️ Admin',
    },
    accountSettings: {
      title: 'Account & Security Settings',
      closeTitle: 'Close',
      tabProfile: '👤 Profile Info',
      tabPassword: '🔑 Change Password',
      tabEmail: '✉️ Email Verification',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Your full name',
      emailLabel: 'Email Address',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '+20 100 000 0000',
      avatarLabel: 'Avatar Image URL (Optional)',
      avatarPlaceholder: 'https://images.unsplash.com/...',
      saveProfileBtn: '💾 Save Profile Changes',
      savingProfile: 'Saving Changes...',
      currentPasswordLabel: 'Current Password',
      currentPasswordPlaceholder: 'Enter your existing password',
      newPasswordLabel: 'New Password (Minimum 6 characters)',
      newPasswordPlaceholder: 'Choose a strong new password',
      confirmNewPasswordLabel: 'Confirm New Password',
      confirmNewPasswordPlaceholder: 'Repeat new password',
      showPasswords: 'Show passwords',
      updatePasswordBtn: '🔒 Update Password',
      updatingPassword: 'Updating Password...',
      verifiedStatus: '✓ Verified',
      unverifiedStatus: '⚠ Unverified',
      verifiedNotice: 'Your account is verified and protected.',
      unverifiedNotice: 'Please confirm your email to secure your account and receive order receipts.',
      tokenLabel: 'Verification Code / Token',
      tokenPlaceholder: 'Paste the verification token received in email...',
      confirmTokenBtn: '✓ Confirm Email Token',
      resendTokenBtn: '✉️ Resend Verification Token',
      allSetMessage: '✓ All Set! No further email actions required for this account.',
    },
    buyerOrders: {
      title: 'Your Order History',
      subtitle: 'Track your deliveries, order details, and leave verified customer reviews.',
      orderNumber: 'Order',
      statusDelivered: 'Delivered',
      statusPaid: 'Paid & Processing',
      shippingTo: 'Shipping to:',
      orderDate: 'Date:',
      itemsHeading: 'Purchased Items:',
      leaveReviewBtn: '⭐ Write Verified Review',
      paymentChannelLabel: 'Payment Channel',
      refLabel: 'Ref / Transaction',
      senderAccountLabel: 'Sender Account',
      fawryKioskRef: 'Fawry Bill Ref',
      noOrdersTitle: 'No orders placed yet',
      noOrdersDesc: 'Your purchased boutique items and delivery statuses will show up here.',
      loadOrdersFailed: 'Failed to load order history',
    },
    reviews: {
      title: 'Verified Customer Reviews',
      basedOn: 'Based on',
      verifiedPurchases: 'verified customer purchases',
      customerReviewsHeading: 'Customer Feedback',
      noReviewsYet: 'No customer reviews yet. Be the first verified buyer to share your feedback!',
      writeReviewHeading: 'Write a Verified Review',
      yourNameLabel: 'Your Full Name',
      yourEmailLabel: 'Buyer Email',
      yourRatingLabel: 'Your Rating',
      yourCommentLabel: 'Your Review & Experience',
      commentPlaceholder: 'Describe the quality, craftsmanship, and fit of this piece...',
      submitReviewBtn: 'Submit Verified Review',
      submittingReview: 'Submitting Review...',
      verifiedPurchaseBadge: '✓ Verified Purchase',
    },
    createMerchantModal: {
      title: 'Launch Your Boutique on SocialHub',
      subtitle: 'Join Egypt’s premier network of independent creators and start selling directly.',
      storeNameLabel: 'Boutique / Brand Name',
      storeNamePlaceholder: 'e.g. Nile Clay Studio',
      emailLabel: 'Owner Email Address',
      emailPlaceholder: 'owner@example.com',
      urlPreview: 'Your Storefront URL will be:',
      openStoreBtn: '🚀 Launch My Store',
      openingStore: 'Setting up storefront...',
      cancelBtn: 'Cancel',
    },
    footer: {
      brandDesc: "Egypt's premier curated marketplace empowering local boutiques, leather craftsmen, and fashion designers with modern digital commerce.",
      discoverHeading: 'Discover',
      communityHeading: 'Community',
      sellerHeading: 'For Sellers',
      rightsReserved: 'All rights reserved. Built for independent Egyptian creators.',
      egyptianPlatform: 'Proudly Made in Egypt 🇪🇬',
    },
  },
  ar: {
    common: {
      language: 'اللغة',
      english: 'English',
      arabic: 'العربية',
      loading: 'جاري التحميل...',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      close: 'إغلاق',
      back: 'رجوع',
      search: 'بحث',
      clear: 'مسح',
      success: 'تمت بنجاح',
      error: 'خطأ',
      egp: 'ج.م',
      verified: 'موثّق',
      unverified: 'غير موثّق',
      items: 'منتجات',
      status: 'الحالة',
      viewAll: 'عرض الكل',
      reset: 'إعادة ضبط',
      actions: 'إجراءات',
      or: 'أو',
      active: 'نشط',
      suspended: 'موقوف',
    },
    header: {
      announcement: 'متاجر وبوتيكات مستقلة وحرفيون محليون موثّقون في جميع أنحاء مصر',
      announcementSub: 'حماية متقدمة متعددة المتاجر وصلاحيات مخصصة مع JWT',
      brandTagline: 'منصة التجارة الإلكترونية للمتاجر المستقلة',
      marketplace: 'السوق',
      sellerPortal: 'بوابة التاجر',
      merchantCenter: 'بوابة التجار',
      shopperFeed: 'واجهة المشتري',
      myStoreDashboard: 'لوحة تحكم متجري',
      adminCenter: 'مركز الإدارة',
      searchPlaceholder: 'ابحث عن أزياء البوتيك، الجلود الطبيعية، الخزف، أو المتاجر...',
      searchMobilePlaceholder: 'ابحث عن منتجات أو متاجر...',
      searchShortcut: 'بحث',
      myOrders: 'طلباتي',
      openStore: '+ افتح متجرك',
      signIn: '👤 تسجيل الدخول',
      cart: 'السلة',
      logout: 'تسجيل الخروج',
      accountSettingsTooltip: 'إعدادات الحساب والأمان',
      matchingStores: 'المتاجر والبوتيكات المطابقة',
      matchingProducts: 'المنتجات والمعروضات المطابقة',
      noExactMatch: 'لا يوجد تطابق تام مع',
      showingClosest: 'عرض أقرب النتائج المقترحة:',
      noResults: 'لا توجد نتائج مطابقة أو قريبة',
      trySearching: 'جرّب البحث عن "كتان"، "جلد"، أو "ساري"',
      viewAllSearchDropdown: 'عرض جميع النتائج المطابقة في صفحة البحث المخصصة',
      enterKeyHint: '↵ إدخال',
      visitStore: 'زيارة المتجر ↗',
    },
    categories: {
      all: '🔥 جميع المعروضات',
      fashion: '👗 أزياء وملابس كتان',
      leather: '👜 جلود يدوية فاخرة',
      home: '🏺 خزف وديكور منزلي',
      accessories: '✨ إكسسوارات',
    },
    hero: {
      badge: '✨ المنصة المصرية الرائدة لاكتشاف المتاجر المستقلة',
      titlePart1: 'تسوّق مباشرة من',
      titleHighlight: 'المصممين والبوتيكات المستقلة',
      description: 'استكشف أزياء الكتان الطبيعية، والمصنوعات الجلدية التراثية، وخزف قرية تونس. كل عملية شراء تدعم مباشرة الحرفيين والمصنعين المصريين مع دفع آمن عبر PayPal.',
      exploreBtn: '🛍️ استكشف السوق',
      seeAllBtn: '🔍 عرض جميع المنتجات',
      storesBtn: '🏬 أبرز المتاجر',
      makersMetric: '100%',
      makersLabel: 'صُنّاع موثّقون',
      ratingMetric: '4.9 ★',
      ratingLabel: 'تقييم العملاء',
      deliveryMetric: 'شحن سريع',
      deliveryLabel: 'توصيل لكافة المحافظات',
      fashionPill: 'أزياء كتان',
      leatherPill: 'جلود طبيعية',
    },
    featuredStores: {
      badge: 'براندات مستقلة',
      title: 'بوتيكات مصرية متميزة',
      description: 'مجموعة مختارة من المصممين والصناع المستقلين المشهود لهم بالحرفية والأصالة.',
      exploreStore: 'زيارة المتجر',
      productsCount: 'منتج متميز',
    },
    catalog: {
      badge: 'كتالوج مختار بعناية',
      title: 'استكشف جميع المعروضات',
      itemCountText: 'قطعة فريدة من البوتيكات والحرفيين المصريين',
      seeAllPaginate: 'عرض الكل مع الصفحات',
      showingText: 'منتجات مختارة',
      sortBy: 'ترتيب حسب:',
      sortFeatured: '✨ الأبرز والأكثر طلباً',
      sortPriceLow: 'السعر: من الأقل للأعلى',
      sortPriceHigh: 'السعر: من الأعلى للأقل',
      sortRating: 'الأعلى تقييماً',
      sortNewest: 'الأحدث إضافة',
      noItemsTitle: 'لم يتم العثور على منتجات تطابق الفلاتر',
      noItemsDesc: 'جرّب تعديل التصنيف أو نطاق السعر أو الحد الأدنى للتقييم لاستكشاف المزيد.',
      resetFilters: 'إعادة ضبط الفلاتر',
    },
    filters: {
      title: 'الفلاتر',
      reset: 'إعادة ضبط',
      category: 'التصنيف',
      priceRange: 'نطاق السعر',
      allPrices: 'جميع الأسعار',
      under500: 'أقل من 500 ج.م',
      from500to1000: '500 إلى 1,000 ج.م',
      over1000: 'أكثر من 1,000 ج.م',
      customRange: 'نطاق مخصص',
      minPrice: 'الحد الأدنى',
      maxPrice: 'الحد الأقصى',
      mediaFormat: 'نوع المعاينة',
      mediaAll: 'الكل',
      mediaVideo: '🎬 ريلز وفيديو',
      mediaImage: '📷 صور فوتوغرافية',
      filterByBoutique: 'تصفية حسب المتجر',
      allBoutiques: '🏬 جميع المتاجر والبوتيكات',
      inStockOnly: 'المتوفر في المخزن فقط',
      minRating: 'الحد الأدنى للتقييم',
      allRatings: 'الكل',
    },
    product: {
      videoBadge: '▶ فيديو',
      featuredBadge: 'متميز',
      originalPrice: 'السعر الأصلي:',
      ratingLabel: 'التقييم',
      inStock: 'متوفر بالمخزن',
      soldOut: 'نفد من المخزن',
      quickBuy: '⚡ شراء سريع',
      addToCart: 'أضف للسلة',
      visitBoutique: 'زيارة البوتيك',
    },
    cart: {
      title: 'عربة التسوق الخاصة بك',
      emptyTitle: 'عربة التسوق فارغة',
      emptySubtitle: 'استكشف الإبداعات اليدوية وادعم البوتيكات والمصممين المصريين.',
      startShopping: 'ابدأ استكشاف المعروضات',
      orderSummary: 'ملخص الطلب',
      subtotal: 'المجموع الفرعي',
      shipping: 'الشحن',
      freeShipping: 'مجاني (لكل المحافظات)',
      platformFee: 'رسوم المنصة (5%)',
      total: 'المبلغ الإجمالي',
      checkoutPaypal: 'الدفع بواسطة PayPal',
      paypalProcessing: 'جاري الاتصال ببوابة PayPal...',
      paypalSuccess: 'تمت الموافقة على الدفع وإنشاء الطلب بنجاح!',
      secureNotice: '🔒 دفع آمن ومشفر بمعيار 256-bit عبر PayPal',
      clearCart: 'تفريغ السلة',
    },
    checkout: {
      selectPaymentMethod: 'طريقة الدفع',
      paymentMethodDesc: 'اختر طريقة الدفع المناسبة لك لإتمام طلبك داخل مصر.',
      codTitle: 'الدفع نقداً عند الاستلام (COD)',
      codDesc: 'ادفع نقداً لمندوب الشحن عند وصول الطلب بدون أي دفع مسبق.',
      fawryTitle: 'فوري باي (كود سداد فوري)',
      fawryDesc: 'ادفع عبر كود سداد مكون من 8 أرقام في أي ماكينة فوري أو تطبيق myFawry.',
      instaPayTitle: 'إنستاباي ومحافظ المحمول',
      instaPayDesc: 'تحويل فوري عبر تطبيق إنستاباي أو محافظ فودافون/أورنج/اتصالات/وي كاش.',
      paypalTitle: 'بايبال (PayPal)',
      paypalDesc: 'دفع رقمي آمن ومشفر عبر البطاقات البنكية الدولية.',
      fawryRefCode: 'كود سداد فوري (رقم الفاتورة)',
      fawryExpiryNotice: 'الكود صالح لمدة 48 ساعة. كود الخدمة: 788 (سوشيال هَب مصر)',
      fawryInstructionsTitle: 'خطوات السداد عبر فوري:',
      fawryStep1: 'توجه إلى أقرب منفذ فوري أو أمان أو افتح تطبيق myFawry.',
      fawryStep2: 'اختر مدفوعات تجارة إلكترونية: منصة سوشيال هَب (كود الخدمة 788).',
      fawryStep3: 'أدخل رقم كود السداد المكون من 8 أرقام وادفع المبلغ المطلوب نقداً.',
      fawryCopyCode: 'نسخ الكود',
      fawryCodeCopied: 'تم النسخ!',
      fawrySimulatePayment: '⚡ محاكاة سداد فوري تجريبياً',
      fawrySimulating: 'جاري محاكاة السداد في المنفذ...',
      fawrySettledSuccess: 'تم سداد فاتورة فوري بنجاح! تم تحويل حالة الطلب إلى مدفوع ومسوّى.',
      walletProvider: 'جهة التحويل / المحفظة',
      senderPhoneLabel: 'رقم محفظة الراسل أو عنوان إنستاباي',
      senderPhonePlaceholder: 'مثال: 01012345678 أو name@instapay',
      transferRefLabel: 'رقم مرجع العملية / كود التحويل',
      transferRefPlaceholder: 'مثال: TXN-849201 أو الرقم المرجعي للإشعار',
      recipientAccountNotice: 'يرجى تحويل إجمالي المبلغ إلى: socialhub@instapay أو محفظة 01001234567',
      walletValidationPhone: 'يرجى إدخال رقم هاتف الراسل أو عنوان إنستاباي.',
      walletValidationRef: 'يرجى إدخال الرقم المرجعي للتحويل.',
      codInstruction: 'تم تأكيد طلبك بنجاح! يرجى تجهيز المبلغ المطلوب نقداً لتسليمه للمندوب عند الاستلام.',
      codZeroUpfrontBadge: 'لا يتطلب دفعاً إلكترونياً مسبقاً',
      orderIdLabel: 'رقم الطلب',
      orderDateLabel: 'تاريخ الطلب',
      shippingAddressPlaceholder: 'عنوان التوصيل (المحافظة، المدينة، الشارع، رقم العقار)',
      statusPending: 'قيد التنفيذ والتجهيز',
      statusAwaitingPayment: 'بانتظار السداد',
      statusPaid: 'مدفوع وجاري التجهيز',
      statusFulfilled: 'تم التنفيذ والتسليم',
      settlementStatusLabel: 'حالة التسوية المالية',
      settled: 'مُسوّى بالكامل',
      pendingCollection: 'بانتظار التحصيل عند الاستلام',
      pendingVerification: 'بانتظار تأكيد التحويل',
      awaitingKiosk: 'بانتظار السداد في المنفذ',
      channelCol: 'قناة الدفع',
      settlementCol: 'حالة التسوية',
      placeOrderCod: 'تأكيد الطلب (الدفع عند الاستلام)',
      generateFawryCode: 'إصدار كود سداد فوري',
      submitInstaPay: 'تأكيد إرسال التحويل عبر إنستاباي',
      checkoutPaypal: 'إتمام الدفع عبر بايبال (PayPal)',
      receiptTitleCod: '✓ تم تأكيد الطلب (الدفع عند الاستلام)',
      receiptTitleFawry: '🧾 بانتظار السداد عبر فوري',
      receiptTitleInstaPay: '⚡ تم تسجيل التحويل - قيد المراجعة والتأكيد',
      receiptTitlePaypal: '✓ تمت الموافقة على الدفع عبر PayPal',
      openPaypalCheckout: 'فتح صفحة سداد بايبال الرسمية ↗',
      deliveryDetails: 'بيانات التوصيل',
      payableOnDelivery: 'المبلغ المستحق نقداً عند الاستلام',
      fawryServiceCodePill: 'الخدمة: 788',
      instaPayPill: 'عناوين / محافظ',
      paypalPill: 'بطاقات',
    },
    searchPage: {
      homeBreadcrumb: 'الرئيسية',
      searchBreadcrumb: 'البحث والكتالوج',
      backToHome: 'العودة للرئيسية',
      resetAllButton: '🔄 إعادة ضبط جميع الفلاتر وعرض المنتجات كاملة',
      bannerBadge: 'محرك بحث السوق الشامل',
      bannerTitle: 'استكشف جميع المعروضات والمتاجر المستقلة',
      inputPlaceholder: 'ابحث عن منتجات، خامات (كتان، جلد)، بوتيكات، أو تصنيفات...',
      matchingBoutiquesTitle: 'البوتيكات والمتاجر المطابقة',
      clickToVisit: 'انقر لزيارة واجهة المتجر',
      filterResults: 'فلترة النتائج',
      showingMatching: 'منتج مطابق',
      forQuery: 'لكلمة البحث',
      itemsPerPage: 'عنصر بالصفحة',
      noProductsTitle: 'لم يتم العثور على منتجات مطابقة لبحثك',
      noProductsDesc: 'لم تطابق أي عناصر فلاتر البحث الحالية. يمكنك مسح البحث أو إعادة ضبط الفلاتر للاطلاع على كل المنتجات.',
      showAllButton: '🔄 عرض جميع المنتجات وإلغاء الفلاتر',
      pageOf: 'صفحة',
      previous: '← السابق',
      next: 'التالي →',
    },
    storefront: {
      backToMarketplace: 'العودة إلى السوق',
      verifiedBoutique: 'بوتيك مصري مستقل موثّق',
      verifiedBadge: 'متجر موثّق',
      boutiqueRating: 'تقييم المتجر',
      reviewsCount: 'تقييم موثّق',
      independentMaker: 'صانع ومصمم مستقل',
      allProductsTab: '🛍️ جميع المنتجات',
      reelsVideoTab: '🎬 ريلز وفيديوهات',
      storeProductsTitle: 'كتالوج المتجر',
      noStoreProducts: 'لا توجد منتجات منشورة حالياً في هذا المتجر.',
    },
    merchantDashboard: {
      title: 'مركز قيادة وإدارة المتجر',
      viewStorefront: 'معاينة واجهة المتجر العامة',
      grossSales: 'إجمالي المبيعات',
      grossSalesDesc: 'حجم المبيعات الإجمالي قبل خصم عمولة المنصة',
      netPayout: 'الأرباح الصافية',
      netPayoutDesc: 'صافي الإيرادات المودع مباشرة في رصيد متجرك',
      netEarnings: 'صافي مستحقات التاجر',
      platformFee: 'عمولة المنصة (5%)',
      platformFeeDesc: 'رسوم تشغيل واستضافة المنصة المحتجزة',
      completedOrders: 'الطلبات المكتملة',
      completedOrdersDesc: 'الطلبات التي تم تسليمها بنجاح للعملاء',
      tabsOverview: '📊 نظرة عامة',
      tabsAddProduct: '➕ إضافة منتج جديد',
      tabsProducts: '🛍️ منتجات المتجر',
      tabsOrders: '📦 تنفيذ وإدارة الطلبات',
      editProductTitle: '✏️ تعديل بيانات المنتج',
      addProductTitle: '➕ إضافة منتج جديد للمتجر',
      editProductDesc: 'تعديل العنوان، السعر، المخزون، أو وسائط هذا المنتج.',
      addProductDesc: 'انشر قطعة فنية جديدة في واجهة متجرك للجمهور.',
      cancelEdit: 'إلغاء التعديل',
      fieldTitle: 'عنوان المنتج',
      fieldTitlePlaceholder: 'مثال: كيمونو كتان طبيعي مصنوع يدوياً',
      fieldPrice: 'السعر (ج.م)',
      fieldStock: 'الكمية المتاحة في المخزن',
      fieldCategory: 'تصنيف المنتج',
      fieldMediaUpload: 'رفع وسائط المنتج (صور / ريلز وفيديو)',
      dragDropText: 'اسحب وأفلت الصورة أو الفيديو هنا، أو',
      clickToUpload: 'تصفح جهازك',
      uploadSizeHint: 'الصور حتى 15 ميجابايت (.jpg, .png, .webp) | الفيديوهات حتى 60 ميجابايت (.mp4, .mov)',
      uploadingMedia: 'جاري رفع الملف إلى خوادم التخزين...',
      orMediaUrl: 'أو أدخل رابط الوسائط المباشر:',
      urlPlaceholder: 'https://images.unsplash.com/... أو /uploads/...',
      videoCheckbox: 'هذا الملف عبارة عن فيديو (تشغيله كريلز تفاعلي)',
      saveChangesBtn: '💾 حفظ تعديلات المنتج',
      publishProductBtn: '🚀 نشر المنتج في المتجر',
      currentProductsTitle: 'المنتجات الحالية بالمتجر',
      currentProductsDesc: 'إدارة، تعديل البيانات، أو حذف المنتجات من متجرك.',
      noProductsYet: 'لم تقم بإضافة منتجات بعد. استخدم النموذج بالأعلى لإضافة منتجك الأول!',
      editTooltip: 'تعديل المنتج',
      deleteTooltip: 'حذف المنتج',
      deleteConfirm: 'هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.',
      deleteProductConfirm: 'هل أنت متأكد من حذف المنتج "{title}" نهائيًا من متجرك؟',
      deleteProductFailed: 'فشل حذف المنتج.',
      uploadMediaFailed: 'فشل رفع ملف الوسائط.',
      storePreviewModeBanner: 'أنت في وضع معاينة المتجر. لنشر المنتجات أو شحن طلبات العملاء أو تحويل المدفوعات، يرجى تسجيل الدخول كتاجر موثق.',
      signInAsMerchantAction: 'تسجيل الدخول كتاجر ←',
      productPublishedSuccess: 'تم نشر المنتج بنجاح!',
      productUpdatedSuccess: 'تم تحديث المنتج بنجاح!',
      uploadPill: '📁 رفع ملف',
      linkUrlPill: '🔗 رابط إلكتروني',
      ordersTableTitle: 'أحدث طلبات المشترين',
      orderIdCol: 'رقم الطلب',
      customerCol: 'العميل',
      itemsCol: 'المنتجات',
      totalCol: 'المبلغ',
      dateCol: 'التاريخ',
      statusCol: 'الحالة',
      channelCol: 'قناة الدفع',
      settlementCol: 'حالة التسوية',
      markDispatched: 'تحديد كتم الشحن ✓',
      completed: 'مكتمل',
      ledgerTransactionsTitle: 'سجل معاملات المتجر وحساب الأرباح',
      ledgerTransactionsDesc: 'سجلات التسويات المالية المدققة وتاريخ صرف المستحقات',
      disbursementCibDesc: 'تحويل بنكي إلى البنك التجاري الدولي (CIB) مصر',
      noOrdersYet: 'لم تتلق أي طلبات شراء في متجرك حتى الآن.',
    },
    adminPortal: {
      title: 'إدارة وحوكمة المنصة',
      subtitle: 'المتابعة المباشرة لكافة العمليات، الإشراف المالي، وإدارة المحتوى.',
      liveGovernanceBadge: '🛡️ وضع مدير المنصة',
      gmvMetric: 'إجمالي حجم التداول (GMV)',
      gmvDesc: 'إجمالي قيمة المبيعات المنفذة عبر كل المتاجر',
      feeMetric: 'إيرادات المنصة (5%)',
      feeDesc: 'رسوم المنصة المحصلة والمودعة في خزينة المنصة',
      platformTakeRate: 'عمولة المنصة 5%',
      activeStoresMetric: 'المتاجر النشطة',
      activeStoresDesc: 'المتاجر والبوتيكات المستقلة المسجلة',
      totalListingsMetric: 'المنتجات المعروضة',
      totalListingsDesc: 'المنتجات المتاحة حالياً للاكتشاف والشراء بالسوق',
      tabsStores: '🏬 إدارة المتاجر',
      tabsListings: '🛍️ فحص وإشراف المنتجات',
      tabsAudit: '📑 سجل طلبات المنصة',
      userDirectoryTab: '👥 دليل المستخدمين',
      refreshMetrics: 'تحديث المؤشرات',
      rolePrefix: 'الدور:',
      systemHealthHeading: 'صحة الهوية والبنية التحتية للمنصة',
      registeredUsersHeading: 'حسابات المستخدمين المسجلة',
      rbacSubtitle: 'دليل التحكم في الوصول المستند إلى الأدوار',
      roleCol: 'الدور',
      associatedStoreCol: 'المتجر المرتبط',
      storesHeading: 'المتاجر والبوتيكات المسجلة',
      storesDesc: 'مراجعة بيانات الشركاء المستقلين أو تعليقهم أو حذفهم.',
      deleteStoreBtn: 'حذف المتجر',
      deleteStoreConfirm: 'هل أنت متأكد من رغبتك في حذف هذا المتجر وجميع منتجاته؟ لا يمكن التراجع عن هذا الإجراء.',
      listingsHeading: 'جميع معروضات السوق',
      listingsDesc: 'فحص وإدارة المنتجات المعروضة في كل المتاجر.',
      deleteProductBtn: 'حذف المعروض',
      deleteProductConfirm: 'هل أنت متأكد من رغبتك في حذف هذا المنتج من المنصة؟',
      auditHeading: 'سجل تدقيق الطلبات الشامل',
      auditDesc: 'سجل كامل ومفصل لجميع المعاملات والعمولات وصافي أرباح التجار.',
      channelCol: 'قناة الدفع',
      settlementCol: 'حالة التسوية',
      allChannelsFilter: 'جميع قنوات الدفع',
      activeStatus: 'نشط ومفعّل',
      suspendedStatus: 'موقوف مؤقتاً',
    },
    authModal: {
      welcomeBack: 'أهلاً بعودتك',
      joinTitle: 'انضم إلى سوشيال هَب مصر',
      forgotTitle: 'نسيت كلمة المرور؟',
      resetTitle: 'تعيين كلمة مرور جديدة',
      signInSubtitle: 'سجّل دخولك للوصول إلى تفضيلاتك وطلباتك ولوحة تحكم متجرك',
      signUpSubtitle: 'اكتشف إبداعات الأزياء والجلود أو أطلق متجرك المستقل اليوم',
      forgotSubtitle: 'أدخل بريدك الإلكتروني لاستلام رمز أو رابط استعادة كلمة المرور',
      resetSubtitle: 'أدخل رمز الاستعادة واختر كلمة مرور قوية جديدة',
      tabSignIn: 'تسجيل الدخول',
      tabCreateAccount: 'إنشاء حساب جديد',
      roleBuyer: '🛍️ تسوق واكتشف',
      roleBuyerDesc: 'استكشف الماركات والمتاجر المحلية',
      roleSeller: '🏬 أطلق متجرك وبع',
      roleSellerDesc: 'افتح متجرك المستقل وابدأ البيع',
      fullNameLabel: 'الاسم الكامل',
      fullNamePlaceholder: 'مثال: ليلى نور',
      storeNameLabel: 'اسم المتجر / البراند',
      storeNamePlaceholder: 'مثال: استوديو اللوتس',
      storeUrlLabel: 'رابط المتجر:',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      currentPasswordLabel: 'كلمة المرور الحالية',
      newPasswordLabel: 'كلمة المرور الجديدة (6 أحرف على الأقل)',
      confirmPasswordLabel: 'تأكيد كلمة المرور الجديدة',
      resetTokenLabel: 'رمز الاستعادة (Token)',
      resetTokenPlaceholder: 'الصق الرمز المستلم في بريدك',
      forgotPasswordLink: 'نسيت كلمة المرور؟',
      signInBtn: 'تسجيل الدخول إلى الحساب ←',
      createAccountBtn: 'إنشاء حسابي الآن ←',
      sendResetBtn: '✉️ إرسال رابط ورمز الاستعادة',
      setNewPasswordBtn: '🔒 تعيين كلمة المرور الجديدة',
      backToSignIn: '← العودة لتسجيل الدخول',
      haveTokenLink: 'لدي رمز استعادة بالفعل ←',
      quickDemoLogins: 'حسابات تجريبية سريعة بضغطة واحدة',
      demoShopper: '👤 مشتري',
      demoSari: '🏬 متجر ساري',
      demoCairo: '👜 جلود القاهرة',
      demoAdmin: '🛡️ مدير المنصة',
    },
    accountSettings: {
      title: 'إعدادات الحساب والأمان',
      closeTitle: 'إغلاق',
      tabProfile: '👤 الملف الشخصي',
      tabPassword: '🔑 تغيير كلمة المرور',
      tabEmail: '✉️ توثيق البريد الإلكتروني',
      fullNameLabel: 'الاسم الكامل',
      fullNamePlaceholder: 'اسمك الكامل',
      emailLabel: 'البريد الإلكتروني',
      phoneLabel: 'رقم الهاتف المحمول',
      phonePlaceholder: '+20 100 000 0000',
      avatarLabel: 'رابط الصورة الرمزية (اختياري)',
      avatarPlaceholder: 'https://images.unsplash.com/...',
      saveProfileBtn: '💾 حفظ تغييرات الملف الشخصي',
      savingProfile: 'جاري الحفظ...',
      currentPasswordLabel: 'كلمة المرور الحالية',
      currentPasswordPlaceholder: 'أدخل كلمة المرور الحالية للحساب',
      newPasswordLabel: 'كلمة المرور الجديدة (6 أحرف كحد أدنى)',
      newPasswordPlaceholder: 'اختر كلمة مرور قوية جديدة',
      confirmNewPasswordLabel: 'تأكيد كلمة المرور الجديدة',
      confirmNewPasswordPlaceholder: 'أعد إدخال كلمة المرور الجديدة',
      showPasswords: 'إظهار كلمات المرور',
      updatePasswordBtn: '🔒 تحديث كلمة المرور',
      updatingPassword: 'جاري تحديث كلمة المرور...',
      verifiedStatus: '✓ موثّق',
      unverifiedStatus: '⚠ غير موثّق',
      verifiedNotice: 'بريدك الإلكتروني موثّق ومحمي بالكامل.',
      unverifiedNotice: 'يرجى تأكيد بريدك الإلكتروني لحماية حسابك وتلقي إيصالات الطلبات.',
      tokenLabel: 'رمز التفعيل والتحقق',
      tokenPlaceholder: 'الصق رمز التحقق المستلم على بريدك...',
      confirmTokenBtn: '✓ تأكيد رمز التفعيل',
      resendTokenBtn: '✉️ إعادة إرسال رمز التحقق',
      allSetMessage: '✓ كل شيء جاهز! لا يلزم اتخاذ أي إجراءات إضافية لهذا الحساب.',
    },
    buyerOrders: {
      title: 'سجل مشترياتك وطلباتك',
      subtitle: 'تتبع حالة التوصيل، تفاصيل الطلب، وكتابة تقييمات المشتري الموثّق.',
      orderNumber: 'طلب رقم',
      statusDelivered: 'تم التسليم',
      statusPaid: 'مدفوع وجاري التجهيز',
      shippingTo: 'الشحن إلى:',
      orderDate: 'التاريخ:',
      itemsHeading: 'المنتجات المطلوبة:',
      leaveReviewBtn: '⭐ كتابة تقييم موثّق',
      paymentChannelLabel: 'طريقة الدفع',
      refLabel: 'رقم العملية / المرجع',
      senderAccountLabel: 'حساب الراسل',
      fawryKioskRef: 'كود سداد فوري',
      noOrdersTitle: 'لم تقم بأي طلبات شراء بعد',
      noOrdersDesc: 'ستظهر هنا جميع مشترياتك من البوتيكات وحالات شحنها وتوصيلها.',
      loadOrdersFailed: 'فشل تحميل سجل الطلبات',
    },
    reviews: {
      title: 'تقييمات المشترين الموثّقين',
      basedOn: 'بناءً على',
      verifiedPurchases: 'عملية شراء موثقة من العملاء',
      customerReviewsHeading: 'آراء وتقييمات العملاء',
      noReviewsYet: 'لا توجد تقييمات منشورة بعد لهذا المنتج. كن أول مشتري موثق يشارك رأيه!',
      writeReviewHeading: 'أضف تقييمك الموثّق',
      yourNameLabel: 'الاسم الكامل',
      yourEmailLabel: 'بريد المشتري',
      yourRatingLabel: 'تقييمك للمنتج',
      yourCommentLabel: 'تفاصيل رأيك وتجربتك',
      commentPlaceholder: 'اكتب تقييمك لجودة المنتج، الخامة، والحرفية...',
      submitReviewBtn: 'إرسال التقييم الموثّق',
      submittingReview: 'جاري إرسال التقييم...',
      verifiedPurchaseBadge: '✓ مشترٍ موثّق',
    },
    createMerchantModal: {
      title: 'أطلق بوتيكك على منصة سوشيال هَب',
      subtitle: 'انضم لشبكة المصممين والحرفيين الرائدة في مصر وابدأ البيع المباشر لآلاف المهتمين.',
      storeNameLabel: 'اسم البوتيك / البراند التجاري',
      storeNamePlaceholder: 'مثال: ستوديو خزف النيل',
      emailLabel: 'بريد صاحب المتجر الإلكتروني',
      emailPlaceholder: 'owner@example.com',
      urlPreview: 'سيكون رابط متجرك المباشر هو:',
      openStoreBtn: '🚀 إطلاق متجري الآن',
      openingStore: 'جاري إنشاء وتجهيز المتجر...',
      cancelBtn: 'إلغاء',
    },
    footer: {
      brandDesc: 'المنصة المصرية الأولى لدعم وتمكين البوتيكات المستقلة، مصممي الأزياء، وحرفيي الجلود بأحدث أدوات التجارة الرقمية.',
      discoverHeading: 'استكشف',
      communityHeading: 'المجتمع',
      sellerHeading: 'للتجار والمصنعين',
      rightsReserved: 'جميع الحقوق محفوظة. صُمم خصيصاً للمبدعين وأصحاب المتاجر المستقلة في مصر.',
      egyptianPlatform: 'صُنع بكل فخر في مصر 🇪🇬',
    },
  },
};
