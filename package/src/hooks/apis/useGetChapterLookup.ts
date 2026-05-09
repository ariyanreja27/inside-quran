import {useEffect, useState} from 'react';
import {IChapterLookUp, QuranTypesEnums} from '../../types';
import {axiosInstance} from '../../utils';

interface IProps {
  chapterId: number;
  type: QuranTypesEnums;
}

const useGetChapterLookup = ({chapterId, type}: IProps) => {
  const [chapterLookUp, setChapterLookUp] = useState<IChapterLookUp[]>();
  useEffect(() => {
    fetchChapterLookUp();
  }, []);
  const fetchChapterLookUp = async () => {
    try {
      const response = await axiosInstance.get(
        `https://api.quran.com/api/qdc/pages/lookup?${type}_number=${chapterId}`,
      );
      const pageslookup = Object.entries(response?.data?.pages);
      const pageslookupEdited = pageslookup?.map(([key, value]) => ({
        page_number: key,
        page_range: value,
      }));
      setChapterLookUp(pageslookupEdited as IChapterLookUp[]);
    } catch (e) {}
  };
  return {chapterLookUp};
};

export default useGetChapterLookup;
