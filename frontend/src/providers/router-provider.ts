import { useCallback } from "react";
import { useNavigate } from "react-router";

export const useRouterProvider = () => {
  const navigate = useNavigate();

  const list = useCallback(
    (resource: string) => {
      navigate(`/${resource}`);
    },
    [navigate]
  );

  const create = useCallback(
    (resource: string) => {
      navigate(`/${resource}/create`);
    },
    [navigate]
  );

  const edit = useCallback(
    (resource: string, id: string | number) => {
      navigate(`/${resource}/edit/${id}`);
    },
    [navigate]
  );

  const show = useCallback(
    (resource: string, id: string | number) => {
      navigate(`/${resource}/view/${id}`);
    },
    [navigate]
  );

  return {
    list,
    create,
    edit,
    show,
  };
};

export default useRouterProvider; 