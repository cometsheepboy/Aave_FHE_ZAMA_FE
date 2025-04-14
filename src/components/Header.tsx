import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { useRouter } from "next/router";

const NAVIGATIONS = [
  {
    href: "/",
    title: "Markets",
  },
  {
    href: "/relayer",
    title: "Relayer",
  },
  {
    href: "/faucet",
    title: "Faucet",
  },
];

export const Header = () => {
  const router = useRouter();

  return (
    <div className="border-b h-16 w-full flex justify-between items-center px-4">
      <div className="flex gap-4 items-center">
        <h1 className="text-2xl">Private Aave</h1>
        <ul className="flex gap-4">
          {NAVIGATIONS.map((item) => (
            <li key={`nav-${item.href}`}>
              <Link
                href={item.href}
                className={router.pathname === item.href ? "underline" : ""}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <ConnectKitButton />
    </div>
  );
};
