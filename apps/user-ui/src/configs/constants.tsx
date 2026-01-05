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
    href: "#",
    onClick: () => {
      window.location.href = `${
        process.env.NEXT_PUBLIC_SELLER_SERVER_URI ||
        "http://localhost:3001"
      }/signup`;
    },
  },
];
