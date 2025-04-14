import { Button } from "@mui/material";
import { sepolia } from "wagmi/chains";

type Props = {
  data: {
    title: string;
    content: string;
    tx?: string;
    allowRetry?: boolean;
    onClick?: () => void;
  };
};

const CustomNotification = ({ data }: Props) => {
  return (
    <div className="flex flex-col w-full">
      <h3 className="text-sm font-semibold">{data.title}</h3>
      <div className="flex flex-col">
        <p className="text-sm mb-2">{data.content}</p>
        {data.tx && (
          <div className="flex justify-end">
            <Button
              size="small"
              variant="contained"
              href={`${sepolia.blockExplorers.default.url}/tx/${data.tx}`}
              target="__blank"
            >
              Open on explorer
            </Button>
          </div>
        )}
        {data.allowRetry && data.onClick && (
          <div className="flex justify-end">
            <Button size="small" variant="contained" onClick={data.onClick}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomNotification;
