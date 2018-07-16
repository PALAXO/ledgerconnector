import javafx.application.Application;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.TabPane;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.stage.Stage;

public class App extends Application {

    @Override
    public void start(Stage primaryStage) throws Exception {
        primaryStage.setTitle("Circularo - Blockchain");

        Scene scene = new Scene(createRoot(), 750, 500);

        primaryStage.setScene(scene);
        primaryStage.show();
    }

    private Parent createRoot() {
        BorderPane bP = new BorderPane();

        bP.setTop(creteTop());
        bP.setCenter(createCenter());

        return bP;
    }

    private Node creteTop() {
        ObservableList<String> networkOptions =
                FXCollections.observableArrayList(
                        "Ripple"
                );

        HBox hBox = new HBox();
        hBox.setPadding(new Insets(5));
        hBox.setAlignment(Pos.CENTER_RIGHT);

        Label selectLbl = new Label("Blockchain network");
        selectLbl.setPadding(new Insets(5));
        ComboBox<String> cmbB = new ComboBox<>(networkOptions);
        cmbB.getSelectionModel().select(0);

        hBox.getChildren().addAll(selectLbl, cmbB);

        return hBox;
    }

    private Node createCenter() {
        TabPane tabPane = new TabPane();

        tabPane.getTabs().addAll(new CreateTab(), new LookUpTab());
        tabPane.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);

        return tabPane;
    }
}
