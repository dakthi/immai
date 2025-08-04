import { motion } from 'framer-motion';
import { Button } from './ui/button';

interface GreetingProps {
  onTopicSelect?: (topic: string) => void;
}

export const Greeting = ({ onTopicSelect }: GreetingProps) => {
  const topics = [
    {
      title: "🍁 Định cư Canada",
      description: "Tìm hiểu về các chương trình định cư",
      query: "Tôi muốn tìm hiểu về các chương trình định cư Canada. Bạn có thể giới thiệu cho tôi những con đường phổ biến nhất không?"
    },
    {
      title: "💼 Việc làm & CV",
      description: "Tư vấn tìm việc và viết CV Canada",
      query: "Tôi cần hỗ trợ về cách tìm việc làm ở Canada và viết CV theo chuẩn Canada. Bạn có thể hướng dẫn tôi không?"
    },
    {
      title: "🏠 Cuộc sống mới",
      description: "Thông tin về cuộc sống ở Canada",
      query: "Tôi muốn biết về cuộc sống ở Canada như nhà ở, y tế, giáo dục và hòa nhập cộng đồng."
    },
    {
      title: "📋 Thủ tục giấy tờ",
      description: "Hướng dẫn chuẩn bị hồ sơ",
      query: "Tôi cần hỗ trợ về thủ tục và giấy tờ cần thiết cho việc định cư Canada."
    }
  ];

  return (
    <div
      key="overview"
      className="max-w-4xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <div className="text-4xl font-bold text-primary mb-2">
          🍁 IMM AI
        </div>
        <div className="text-xl text-muted-foreground">
          Trợ lý AI định cư Canada
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold text-center mb-2"
      >
        Xin chào! 👋
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-xl text-zinc-500 text-center mb-8"
      >
        Tôi có thể giúp bạn điều gì về định cư Canada hôm nay?
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto"
      >
        {topics.map((topic, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 text-left flex flex-col items-start space-y-2 hover:bg-accent transition-colors"
            onClick={() => onTopicSelect?.(topic.query)}
          >
            <div className="font-semibold text-sm">{topic.title}</div>
            <div className="text-xs text-muted-foreground">{topic.description}</div>
          </Button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-8 text-sm text-muted-foreground"
      >
        ⚠️ Thông tin chỉ mang tính tham khảo. Vui lòng kiểm tra với nguồn chính thức.
      </motion.div>
    </div>
  );
};
