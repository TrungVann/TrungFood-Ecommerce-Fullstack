export const navItems: NavItemsTypes[] = [
  {
    title: "Trang chủ",
    href: "/",
  },
  {
    title: "Sản phẩm",
    href: "/products",
  },
  {
    title: "Cửa hàng",
    href: "/shops",
  },
  {
    title: "Khuyến mãi",
    href: "/offers",
  },
  {
    title: "Trở thành người bán",
    href: `${
      process.env.NEXT_PUBLIC_SELLER_SERVER_URI ||
      "https://seller.shondhane.com"
    }/signup`,
  },
];
