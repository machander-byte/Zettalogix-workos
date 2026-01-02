import TaskDetailsPage from '@/components/TaskDetailsPage';

type Props = {
  params: { taskId: string };
};

export default function AdminTaskDetailsPage({ params }: Props) {
  return <TaskDetailsPage taskId={params.taskId} />;
}
