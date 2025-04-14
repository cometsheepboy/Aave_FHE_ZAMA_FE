import { useContext } from "react";
import { MainContext } from "@/contexts/MainContext";

export const useMainContext = () => useContext(MainContext);
