import { Group, Switch, Text } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";

export const UISettingsSection = ({ isDark }: { isDark: boolean }) => {
  const { setColorScheme } = useMantineColorScheme();

  const handleToggle = (checked: boolean) => {
    setColorScheme(checked ? "dark" : "light");
  };

  return (
    <div className="space-y-3 text-xs">
      <Group justify="space-between" align="center">
        <Text size="sm">Dark mode</Text>
        <Switch
          size="sm"
          checked={isDark}
          onChange={(e) => handleToggle(e.currentTarget.checked)}
        />
      </Group>
    </div>
  );
};

export default UISettingsSection;

